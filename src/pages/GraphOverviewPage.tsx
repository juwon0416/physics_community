import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Link2, UploadCloud } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui';
import { KnowledgeImportManager } from '../components/admin/KnowledgeImportManager';
import DirectoryStructureManager from '../components/admin/DirectoryStructureManager';
import OntologyGraphView, {
    type OntologyGraphHandle,
} from '../components/graph/OntologyGraphView';
import type { GraphModel } from '../lib/graphModel';
import { fetchGraphModel } from '../lib/graphModel';
import { useAuth } from '../lib/auth';

export function GraphOverviewPage() {
    const { isAdmin, user } = useAuth();
    const location = useLocation();
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [model, setModel] = useState<GraphModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isImportManagerOpen, setIsImportManagerOpen] = useState(false);
    const [isStructureManagerOpen, setIsStructureManagerOpen] = useState(false);
    const graphRef = useRef<OntologyGraphHandle>(null);
    const initialFieldId = new URLSearchParams(location.search).get('field');

    const reloadGraph = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchGraphModel('legacy');
            setModel(data);
        } catch (error) {
            console.error('Failed to reload ontology graph:', error);
            setModel(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void reloadGraph();
    }, [reloadGraph]);

    useEffect(() => {
        setFocusedNodeId(initialFieldId);
        setIsImportManagerOpen(false);
        setIsStructureManagerOpen(false);
    }, [initialFieldId, location.key]);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [location.key]);

    const handleRefresh = async () => {
        graphRef.current?.resetView();
        await reloadGraph();
    };

    return (
        <div className="relative flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
            {isLoading ? (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                            Loading Physics Ontology...
                        </span>
                    </div>
                </div>
            ) : null}

            {model ? (
                <OntologyGraphView
                    ref={graphRef}
                    model={model}
                    focusedNodeId={focusedNodeId}
                    initialHeldNodeId={initialFieldId}
                    onNodeFocus={setFocusedNodeId}
                    onRefresh={handleRefresh}
                    headerActions={
                        isAdmin ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-white/20 bg-[#000]/60 text-white hover:bg-white hover:text-black"
                                    onClick={() => {
                                        setIsStructureManagerOpen(false);
                                        setIsImportManagerOpen(true);
                                    }}
                                    title="Import source into knowledge repository"
                                >
                                    <UploadCloud className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-white/20 bg-[#000]/60 text-white hover:bg-white hover:text-black"
                                    onClick={() => {
                                        setIsImportManagerOpen(false);
                                        setIsStructureManagerOpen(true);
                                    }}
                                    title="Manage directory structure"
                                >
                                    <Link2 className="h-4 w-4" />
                                </Button>
                            </>
                        ) : null
                    }
                />
            ) : null}

            {isAdmin && isImportManagerOpen ? (
                <KnowledgeImportManager
                    graphView="legacy"
                    userId={user?.id ?? null}
                    onClose={() => setIsImportManagerOpen(false)}
                    onImported={reloadGraph}
                />
            ) : null}

            {isAdmin && isStructureManagerOpen ? (
                <DirectoryStructureManager
                    graphView="legacy"
                    nodes={model?.nodes || []}
                    onClose={() => setIsStructureManagerOpen(false)}
                    onUpdate={reloadGraph}
                />
            ) : null}
        </div>
    );
}
