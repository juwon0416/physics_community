import type { GraphEdge, GraphModel } from './graphModel';

export function getChronologicalEdges(model: GraphModel): GraphEdge[] {
    const nodeById = new Map(model.nodes.map((node) => [node.id, node]));

    const passthroughEdges = model.edges.filter((edge) => {
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        if (!sourceNode || !targetNode) return false;

        const isFieldToTopic =
            sourceNode.type === 'field' &&
            targetNode.type === 'topic';

        const isSameFieldTopicChain =
            sourceNode.type === 'topic' &&
            targetNode.type === 'topic' &&
            sourceNode.data?.fieldId === targetNode.data?.fieldId &&
            sourceNode.data?.year &&
            targetNode.data?.year;

        return !isFieldToTopic && !isSameFieldTopicChain;
    });

    const topicsByField = new Map<string, typeof model.nodes>();
    model.nodes.forEach((node) => {
        if (node.type !== 'topic') return;

        const fieldId = typeof node.data?.fieldId === 'string' ? node.data.fieldId : null;
        const year = Number(node.data?.year);
        if (!fieldId || !Number.isFinite(year)) return;

        const currentTopics = topicsByField.get(fieldId) ?? [];
        currentTopics.push(node);
        topicsByField.set(fieldId, currentTopics);
    });

    const chainEdges: GraphEdge[] = [];

    topicsByField.forEach((fieldTopics, fieldId) => {
        fieldTopics.sort((left, right) => Number(left.data?.year) - Number(right.data?.year));

        if (fieldTopics.length > 0 && nodeById.has(fieldId)) {
            chainEdges.push({
                source: fieldId,
                target: fieldTopics[0].id,
                type: 'temporal',
            });
        }

        for (let index = 0; index < fieldTopics.length - 1; index += 1) {
            chainEdges.push({
                source: fieldTopics[index].id,
                target: fieldTopics[index + 1].id,
                type: 'temporal',
            });
        }
    });

    return [...passthroughEdges, ...chainEdges];
}
