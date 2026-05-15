import { useEffect, useMemo, useRef, useState } from 'react';
import Quill, { type DeltaStatic, type RangeStatic, type Sources } from 'quill';
import 'quill/dist/quill.snow.css';
import * as katex from 'katex';
import 'katex/dist/katex.min.css';
import { FIELDS } from '../../data/seed';
import { storage } from '../../data/storage';
import { createInlineBacklinkMarkup } from '../../lib/backlinks';
import type { GraphNode } from '../../lib/graphModel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from '../ui';
import './GraphQuillEditor.css';

declare global {
    interface Window {
        katex?: typeof import('katex');
    }
}

if (typeof window !== 'undefined') {
    window.katex = katex;
}

interface GraphQuillEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    containerId?: string;
    backlinkNodes?: GraphNode[];
    currentTopicId?: string | null;
}

interface BacklinkOption {
    id: string;
    label: string;
    type: GraphNode['type'];
    fieldLabel: string | null;
    searchValue: string;
}

const normalizeEditorHtml = (content: string) => {
    const normalized = content.trim();
    return normalized === '<p><br></p>' ? '' : normalized;
};

const TOOLBAR_SELECT_OPTIONS = {
    header: ['1', '2', '3', ''],
    align: ['', 'center', 'right', 'justify'],
};

const NODE_TYPE_LABELS: Record<GraphNode['type'], string> = {
    root: 'Root',
    field: 'Field',
    cluster: 'Cluster',
    topic: 'Topic',
    concept: 'Concept',
    section: 'Section',
};

const NODE_TYPE_ORDER: Record<GraphNode['type'], number> = {
    topic: 0,
    cluster: 1,
    concept: 2,
    section: 3,
    field: 4,
    root: 5,
};

type QuillTextEditingApi = Quill & {
    getText(index?: number, length?: number): string;
    deleteText(index: number, length: number, source?: Sources): DeltaStatic;
    insertText(index: number, text: string, source?: Sources): DeltaStatic;
    focus(): void;
};

const normalizeSearchTerm = (value: string) =>
    value.replace(/\s+/g, ' ').replace(/^\[\[|\]\]$/g, '').trim().toLowerCase();

const getSelectedText = (editor: QuillTextEditingApi, range: RangeStatic) =>
    range.length > 0 ? editor.getText(range.index, range.length).replace(/\s+/g, ' ').trim() : '';

function insertBacklinkAtRange(editor: Quill, range: RangeStatic, targetText: string) {
    const editorApi = editor as QuillTextEditingApi;
    const backlinkMarkup = createInlineBacklinkMarkup(targetText);
    if (!backlinkMarkup) return;

    if (range.length > 0) {
        editorApi.deleteText(range.index, range.length, 'user');
    }

    editorApi.insertText(range.index, backlinkMarkup, 'user');
    editor.setSelection(range.index + backlinkMarkup.length, 0, 'silent');
    editorApi.focus();
}

async function handleImageUpload(editor: Quill) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        const { url, error } = await storage.uploadFile(file);
        if (error || !url) {
            console.error('Image upload failed:', error);
            window.alert(error?.message || 'Image upload failed.');
            return;
        }

        const range = editor.getSelection(true);
        const insertAt = range ? range.index : editor.getLength();
        editor.insertEmbed(insertAt, 'image', url, 'user');
        editor.setSelection(insertAt + 1, 0, 'silent');
    };
}

export function GraphQuillEditor({
    value,
    onChange,
    placeholder,
    containerId = 'editor-container',
    backlinkNodes = [],
    currentTopicId = null,
}: GraphQuillEditorProps) {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const editorHostRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const onChangeRef = useRef(onChange);
    const latestValueRef = useRef(value);
    const selectionRef = useRef<RangeStatic | null>(null);
    const pendingBacklinkRangeRef = useRef<RangeStatic | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isBacklinkDialogOpen, setIsBacklinkDialogOpen] = useState(false);
    const [backlinkSearch, setBacklinkSearch] = useState('');

    const backlinkOptions = useMemo<BacklinkOption[]>(() => {
        const fieldLabelById = new Map(FIELDS.map((field) => [field.id, field.name]));

        return backlinkNodes
            .filter((node) => node.id !== 'root' && node.id !== currentTopicId)
            .map((node) => {
                const fieldId = typeof node.data?.fieldId === 'string' ? node.data.fieldId : null;
                const fieldLabel = fieldId ? fieldLabelById.get(fieldId) || fieldId : null;

                return {
                    id: node.id,
                    label: node.label,
                    type: node.type,
                    fieldLabel,
                    searchValue: [
                        node.label,
                        node.id,
                        NODE_TYPE_LABELS[node.type],
                        fieldLabel,
                        typeof node.slug === 'string' ? node.slug : null,
                    ]
                        .filter((entry): entry is string => Boolean(entry))
                        .join(' ')
                        .toLowerCase(),
                };
            })
            .sort((left, right) => {
                const typeDifference = NODE_TYPE_ORDER[left.type] - NODE_TYPE_ORDER[right.type];
                if (typeDifference !== 0) return typeDifference;
                return left.label.localeCompare(right.label);
            });
    }, [backlinkNodes, currentTopicId]);

    const filteredBacklinkOptions = useMemo(() => {
        const normalizedSearch = normalizeSearchTerm(backlinkSearch);
        if (!normalizedSearch) {
            return backlinkOptions;
        }

        return backlinkOptions.filter((option) => option.searchValue.includes(normalizedSearch));
    }, [backlinkOptions, backlinkSearch]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        latestValueRef.current = value;
    }, [value]);

    useEffect(() => {
        if (!isBacklinkDialogOpen) return;

        const focusTimer = window.setTimeout(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        }, 0);

        return () => {
            window.clearTimeout(focusTimer);
        };
    }, [isBacklinkDialogOpen]);

    useEffect(() => {
        if (!toolbarRef.current || !editorHostRef.current || quillRef.current) return;

        const editorHost = editorHostRef.current;
        const editor = new Quill(editorHostRef.current, {
            theme: 'snow',
            placeholder,
            modules: {
                formula: true,
                toolbar: {
                    container: toolbarRef.current,
                    handlers: {
                        image: () => {
                            void handleImageUpload(editor);
                        },
                        backlink: () => {
                            const editorApi = editor as QuillTextEditingApi;
                            const range = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
                            pendingBacklinkRangeRef.current = range;
                            setBacklinkSearch(getSelectedText(editorApi, range));
                            setIsBacklinkDialogOpen(true);
                        },
                    },
                },
            },
        });

        quillRef.current = editor;

        const initialHtml = normalizeEditorHtml(latestValueRef.current);
        if (initialHtml) {
            const delta = editor.clipboard.convert(initialHtml);
            editor.setContents(delta, 'silent');
        } else {
            editor.setText('', 'silent');
        }

        const handleTextChange = (
            _delta: DeltaStatic,
            _oldDelta: DeltaStatic,
            source: Sources,
        ) => {
            if (source === 'silent') return;
            const nextValue = normalizeEditorHtml(editor.root.innerHTML);
            latestValueRef.current = nextValue;
            onChangeRef.current(nextValue);
        };

        const handleSelectionChange = (range: RangeStatic | null) => {
            selectionRef.current = range;
        };

        editor.on('text-change', handleTextChange);
        editor.on('selection-change', handleSelectionChange);

        return () => {
            editor.off('text-change', handleTextChange);
            editor.off('selection-change', handleSelectionChange);
            quillRef.current = null;

            editorHost.innerHTML = '';
            editorHost.className = 'graph-quill-editor-host';
        };
    }, [placeholder]);

    useEffect(() => {
        const editor = quillRef.current;
        if (!editor) return;

        editor.root.dataset.placeholder = placeholder || '';
    }, [placeholder]);

    useEffect(() => {
        const editor = quillRef.current;
        if (!editor) return;

        const currentValue = normalizeEditorHtml(editor.root.innerHTML);
        const nextValue = normalizeEditorHtml(value);
        if (currentValue === nextValue) return;

        const previousSelection = selectionRef.current || editor.getSelection();

        if (nextValue) {
            const delta = editor.clipboard.convert(nextValue);
            editor.setContents(delta, 'silent');
        } else {
            editor.setText('', 'silent');
        }

        if (previousSelection) {
            const maxIndex = Math.max(0, editor.getLength() - 1);
            const safeIndex = Math.min(previousSelection.index, maxIndex);
            const safeLength = Math.max(0, Math.min(previousSelection.length, maxIndex - safeIndex));
            editor.setSelection(safeIndex, safeLength, 'silent');
            selectionRef.current = { index: safeIndex, length: safeLength };
        }
    }, [value]);

    const handleBacklinkDialogChange = (open: boolean) => {
        setIsBacklinkDialogOpen(open);
        if (!open) {
            setBacklinkSearch('');
            pendingBacklinkRangeRef.current = null;
        }
    };

    const handleBacklinkSelect = (option: BacklinkOption) => {
        const editor = quillRef.current;
        if (!editor) return;

        const range = pendingBacklinkRangeRef.current || editor.getSelection(true) || {
            index: editor.getLength(),
            length: 0,
        };

        insertBacklinkAtRange(editor, range, option.label);
        handleBacklinkDialogChange(false);
    };

    return (
        <>
            <div id={containerId} className="graph-editor-container flex-1 h-full">
                <div ref={toolbarRef} className="ql-toolbar ql-snow">
                    <span className="ql-formats">
                        <select className="ql-header" defaultValue="">
                            {TOOLBAR_SELECT_OPTIONS.header.map((optionValue) => (
                                <option key={`header-${optionValue || 'default'}`} value={optionValue} />
                            ))}
                        </select>
                    </span>

                    <span className="ql-formats">
                        <button type="button" className="ql-bold" aria-label="Bold" />
                        <button type="button" className="ql-italic" aria-label="Italic" />
                        <button type="button" className="ql-underline" aria-label="Underline" />
                        <button type="button" className="ql-strike" aria-label="Strike" />
                    </span>

                    <span className="ql-formats">
                        <button type="button" className="ql-script" value="sub" aria-label="Subscript" />
                        <button type="button" className="ql-script" value="super" aria-label="Superscript" />
                    </span>

                    <span className="ql-formats">
                        <button type="button" className="ql-blockquote" aria-label="Blockquote" />
                        <button type="button" className="ql-code-block" aria-label="Code block" />
                    </span>

                    <span className="ql-formats">
                        <button type="button" className="ql-list" value="ordered" aria-label="Ordered list" />
                        <button type="button" className="ql-list" value="bullet" aria-label="Bullet list" />
                    </span>

                    <span className="ql-formats">
                        <select className="ql-align" defaultValue="">
                            {TOOLBAR_SELECT_OPTIONS.align.map((optionValue) => (
                                <option key={`align-${optionValue || 'default'}`} value={optionValue} />
                            ))}
                        </select>
                    </span>

                    <span className="ql-formats">
                        <button type="button" className="ql-link" aria-label="Insert link" />
                        <button type="button" className="ql-backlink" aria-label="Insert link" />
                        <button type="button" className="ql-image" aria-label="Insert image" />
                        <button type="button" className="ql-formula" aria-label="Insert formula" />
                    </span>

                    <span className="ql-formats">
                        <button type="button" className="ql-clean" aria-label="Clear formatting" />
                    </span>
                </div>

                <div ref={editorHostRef} className="graph-quill-editor-host" />
            </div>

            <Dialog open={isBacklinkDialogOpen} onOpenChange={handleBacklinkDialogChange}>
                <DialogContent className="max-w-2xl border-white/12 bg-[#080808] p-0 text-white shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
                    <div className="flex max-h-[80vh] flex-col">
                        <DialogHeader className="border-b border-white/10 px-6 pb-4 pt-6">
                            <DialogTitle className="text-base font-medium tracking-[0.08em] text-white">Insert Link</DialogTitle>
                            <DialogDescription className="mt-2 text-sm leading-6 text-white/52">
                                Select a node to insert as <code className="rounded bg-white/8 px-1.5 py-0.5 text-white/72">[[...]]</code>.
                                Saving the document will update the graph.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="border-b border-white/8 px-6 py-4">
                            <Input
                                ref={searchInputRef}
                                value={backlinkSearch}
                                onChange={(event) => setBacklinkSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && filteredBacklinkOptions.length > 0) {
                                        event.preventDefault();
                                        handleBacklinkSelect(filteredBacklinkOptions[0]);
                                    }
                                }}
                                placeholder="Search topics, concepts, or sections..."
                                className="border-white/12 bg-white/5 text-white placeholder:text-white/28 focus-visible:ring-white/30 focus-visible:ring-offset-0"
                            />
                            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/34">
                                {filteredBacklinkOptions.length} node{filteredBacklinkOptions.length === 1 ? '' : 's'} found
                            </div>
                        </div>

                        <div className="overflow-y-auto px-3 py-3">
                            {filteredBacklinkOptions.length > 0 ? (
                                <div className="space-y-1">
                                    {filteredBacklinkOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => handleBacklinkSelect(option)}
                                            className="flex w-full items-start justify-between gap-3 rounded-2xl border border-transparent bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/14 hover:bg-white/[0.06]"
                                        >
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium text-white/88">
                                                    {option.label}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/34">
                                                    <span>{NODE_TYPE_LABELS[option.type]}</span>
                                                    {option.fieldLabel ? <span>{option.fieldLabel}</span> : null}
                                                    <span className="font-mono normal-case tracking-normal text-white/24">
                                                        {option.id}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 rounded-full border border-white/12 px-2.5 py-1 text-[11px] text-white/52">
                                                Insert
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-3 py-12 text-center text-sm text-white/38">
                                    No matching nodes found.
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default GraphQuillEditor;
