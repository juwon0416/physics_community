import FileOntologyCanvas from '../components/graph/FileOntologyCanvas';
import { useAuth } from '../lib/auth';

export function GraphOverviewPage() {
    const { isAdmin, nickname } = useAuth();

    return <FileOntologyCanvas isEditable={isAdmin} currentUserLabel={nickname} />;
}
