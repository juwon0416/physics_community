// src/components/admin/LinkManager.tsx
import { useState, useEffect } from 'react';
import { X, Link2, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { GraphNode } from '../../lib/graphModel';

interface LinkManagerProps {
    nodes: GraphNode[];
    onClose: () => void;
    onUpdate: () => void;
}

interface DatabaseEdge {
    id: string;
    source: string;
    target: string;
    label?: string | null;
}

export function LinkManager({ nodes, onClose, onUpdate }: LinkManagerProps) {
    const [source, setSource] = useState('');
    const [target, setTarget] = useState('');
    const [label, setLabel] = useState('mentions');
    const [isSaving, setIsSaving] = useState(false);
    
    // Custom edges (from DB)
    const [dbEdges, setDbEdges] = useState<DatabaseEdge[]>([]);

    useEffect(() => {
        fetchDbEdges();
    }, []);

    const fetchDbEdges = async () => {
        const { data, error } = await supabase.from('graph_edges').select('*');
        if (error) console.error("Error fetching DbEdges:", error);
        if (data) setDbEdges(data);
    };

    const handleCreateLink = async () => {
        if (!source || !target || source === target) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('graph_edges').insert({
                source,
                target,
                label
            });
            if (error) throw error;
            await fetchDbEdges();
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Failed to connect nodes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLink = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('graph_edges').delete().eq('id', id);
            if (error) throw error;
            await fetchDbEdges();
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const sortedNodes = [...nodes].sort((a, b) => a.label.localeCompare(b.label));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#2f3439] border border-white/10 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Link2 className="w-5 h-5" /> Edge Link Manager
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/70 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-6 text-white text-sm">
                    {/* Create Link Form */}
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4 shadow-inner">
                        <h3 className="font-medium text-white/90">Create New Connection</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Source Node</label>
                                <select 
                                    className="w-full bg-[#1a1d21] border border-white/10 rounded-md p-2 text-white/90 outline-none focus:border-primary transition"
                                    value={source} 
                                    onChange={e => setSource(e.target.value)}
                                >
                                    <option value="">-- Select Source --</option>
                                    {sortedNodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1">Target Node</label>
                                <select 
                                    className="w-full bg-[#1a1d21] border border-white/10 rounded-md p-2 text-white/90 outline-none focus:border-primary transition"
                                    value={target} 
                                    onChange={e => setTarget(e.target.value)}
                                >
                                    <option value="">-- Select Target --</option>
                                    {sortedNodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-end gap-4 mt-2">
                            <div className="flex-1">
                                <label className="block text-xs text-white/50 mb-1">Relationship Type</label>
                                <select 
                                    className="w-full bg-[#1a1d21] border border-white/10 rounded-md p-2 text-white/90 outline-none focus:border-primary transition"
                                    value={label} 
                                    onChange={e => setLabel(e.target.value)}
                                >
                                    <option value="mentions">mentions (Concept Link)</option>
                                    <option value="prerequisite">prerequisite</option>
                                    <option value="related">related</option>
                                    <option value="temporal">temporal</option>
                                </select>
                            </div>
                            <button 
                                onClick={handleCreateLink}
                                disabled={!source || !target || source === target || isSaving}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" /> Add Link
                            </button>
                        </div>
                    </div>

                    {/* Active Connections List */}
                    <div>
                        <h3 className="font-medium text-white/90 mb-3 flex items-center justify-between">
                            Custom Database Edges
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full">{dbEdges.length} items</span>
                        </h3>
                        <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden shadow-inner">
                            {dbEdges.length === 0 ? (
                                <div className="p-4 text-center text-white/50 text-xs py-8">No custom links found in database.</div>
                            ) : (
                                <ul className="divide-y divide-white/5 max-h-60 overflow-auto">
                                    {dbEdges.map(edge => {
                                        const sNode = nodes.find(n => n.id === edge.source)?.label || edge.source;
                                        const tNode = nodes.find(n => n.id === edge.target)?.label || edge.target;
                                        return (
                                            <li key={edge.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 text-white/80">
                                                        <span className="font-semibold truncate max-w-[150px]" title={sNode}>{sNode}</span>
                                                        <span className="text-primary/50 text-xs">→</span>
                                                        <span className="font-semibold truncate max-w-[150px]" title={tNode}>{tNode}</span>
                                                    </div>
                                                    <div className="text-[10px] text-white/40 font-mono mt-1">
                                                        <span className="bg-white/10 px-1 py-0.5 rounded mr-1">{edge.label || 'mentions'}</span>
                                                        {edge.source} {'->'} {edge.target}
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteLink(edge.id)}
                                                    disabled={isSaving}
                                                    className="p-2 ml-4 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition disabled:opacity-50"
                                                    title="Delete this edge connection"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
