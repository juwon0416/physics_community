import FileOntologyCanvas from '../components/graph/FileOntologyCanvas';
import { useAuth } from '../lib/auth';

export function GraphOverviewPage() {
    const { canEditGraph, nickname } = useAuth();

    return <FileOntologyCanvas isEditable={canEditGraph} currentUserLabel={nickname} />;
}
