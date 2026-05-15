declare module 'quill' {
    export type Sources = 'api' | 'silent' | 'user';

    export interface DeltaStatic {
        ops?: unknown[];
    }

    export interface RangeStatic {
        index: number;
        length: number;
    }

    export interface QuillOptionsStatic {
        theme?: string;
        placeholder?: string;
        modules?: Record<string, unknown>;
    }

    export default class Quill {
        constructor(container: Element | string, options?: QuillOptionsStatic);

        root: HTMLElement;

        clipboard: {
            convert(html?: string): DeltaStatic;
        };

        on(
            eventName: 'text-change',
            handler: (delta: DeltaStatic, oldDelta: DeltaStatic, source: Sources) => void,
        ): void;

        on(
            eventName: 'selection-change',
            handler: (
                range: RangeStatic | null,
                oldRange: RangeStatic | null,
                source: Sources,
            ) => void,
        ): void;

        off(
            eventName: 'text-change',
            handler: (delta: DeltaStatic, oldDelta: DeltaStatic, source: Sources) => void,
        ): void;

        off(
            eventName: 'selection-change',
            handler: (
                range: RangeStatic | null,
                oldRange: RangeStatic | null,
                source: Sources,
            ) => void,
        ): void;

        getSelection(focus?: boolean): RangeStatic | null;
        setSelection(index: number, length?: number, source?: Sources): void;
        setSelection(range: RangeStatic, source?: Sources): void;
        insertEmbed(index: number, embed: string, value: unknown, source?: Sources): void;
        setContents(delta: DeltaStatic, source?: Sources): void;
        setText(text: string, source?: Sources): void;
        getLength(): number;
    }
}
