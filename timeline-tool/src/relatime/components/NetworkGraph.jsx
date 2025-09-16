import { useEffect } from 'react';
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { computeNodeVisFromSettings } from "../utils/nodeHelpers";

export default function NetworkGraph({
    graphData,
    nodeDetails,
    projectSettings,
    containerRef,
    networkRef,
    nodesRef,
    setGraphMounted,
    setSelectedNode,
    setShowContextMenu,
    setContextMenuPosition,
    setContextTarget,
    setIsDetailsVisible,
    setJustClosedRecently,
    isDarkMode
}) {
    useEffect(() => {
        const processedNodes = graphData.nodes.map((node) => {
            const detail = nodeDetails?.[node.id] || {};
            const styled = computeNodeVisFromSettings({ node, details: detail, projectSettings });
            return { ...node, ...styled };
        });

        const nodes = new DataSet(processedNodes);

        const styledEdges = graphData.edges.map(edge => {
            let style = {};
            if (edge.level === 2) { // strong
                style = { width: 4, dashes: false };
            } else if (edge.level === 0) { // weak
                style = { width: 2, dashes: [5, 5] };
            } else { // normal
                style = { width: 2, dashes: false };
            }
            return { ...edge, ...style };
        });
        const edges = new DataSet(styledEdges);

        nodesRef.current = nodes;
        setGraphMounted(true);

        const data = { nodes, edges };
        const options = {
            physics: {
                enabled: true,
                solver: "forceAtlas2Based",
                stabilization: {
                    iterations: 150,
                    fit: true
                },
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.01,
                    springLength: 200,
                    springConstant: 0.05,
                    avoidOverlap: 1
                }
            },
            layout: {
                improvedLayout: true
            },
            nodes: {
                shape: "dot",
                size: 30,
                font: { size: 10, color: isDarkMode ? "#fff" : "#333" },
                borderWidth: 2,
                borderWidthSelected: 3
            },
            edges: {
                width: 2,
                color: {
                    color: "#888",
                    highlight: "yellow",
                },
                selectionWidth: 3,
                smooth: false,
                font: { align: "top" },
                arrows: { to: { enabled: true, scaleFactor: 1 } }
            },
            interaction: {
                multiselect: false,
                navigationButtons: true,
                selectConnectedEdges: false
            }
        };

        if (containerRef.current) {
            networkRef.current = new Network(containerRef.current, data, options);

            const handleRightClick = (e) => {
                e.preventDefault();
                const rect = containerRef.current.getBoundingClientRect();
                const pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };

                const nodeId = networkRef.current.getNodeAt(pointer);
                if (nodeId) {
                    // make only this node selected
                    networkRef.current.unselectAll();
                    networkRef.current.selectNodes([nodeId], false);

                    setContextTarget({ type: 'node', id: nodeId });
                    setContextMenuPosition({ x: e.clientX, y: e.clientY });
                    setShowContextMenu(true);
                    return;
                }

                const edgeId = networkRef.current.getEdgeAt(pointer);
                if (edgeId) {
                    // make only this edge selected
                    networkRef.current.unselectAll();
                    networkRef.current.selectEdges([edgeId], false);

                    setContextTarget({ type: 'edge', id: edgeId });
                    setContextMenuPosition({ x: e.clientX, y: e.clientY });
                    setShowContextMenu(true);
                } else {
                    networkRef.current.unselectAll();
                    setShowContextMenu(false);
                    setContextTarget(null);
                }
            };

            containerRef.current.addEventListener("contextmenu", handleRightClick);
            networkRef.current.on("click", function (params) {
                // clicked a single node
                if (params.nodes.length === 1 && params.edges.length === 0) {
                    const nodeId = params.nodes[0];

                    // select only this node
                    networkRef.current.unselectAll();
                    networkRef.current.selectNodes([nodeId], false);

                    setSelectedNode(nodeId);
                    setIsDetailsVisible(true);
                    setJustClosedRecently(true);

                    // also close any context menu
                    setShowContextMenu(false);
                    setContextTarget(null);
                    return;
                }

                // clicked a single edge
                if (params.edges.length === 1 && params.nodes.length === 0) {
                    const edgeId = params.edges[0];

                    // select only this edge
                    networkRef.current.unselectAll();
                    networkRef.current.selectEdges([edgeId], false);

                    // when an edge is chosen, hide node details if open
                    setIsDetailsVisible(false);
                    setSelectedNode(null);

                    // also close any context menu
                    setShowContextMenu(false);
                    setContextTarget(null);
                    return;
                }

                // clicked on empty space or mixed selection -> clear all
                networkRef.current.unselectAll();
                setIsDetailsVisible(false);
                setSelectedNode(null);
                setShowContextMenu(false);
                setContextTarget(null);
            });
        }
    }, [graphData, nodeDetails, projectSettings, isDarkMode]);
}