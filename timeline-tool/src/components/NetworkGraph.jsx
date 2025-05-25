import { useEffect } from 'react';
import { Network } from "vis-network";
import { DataSet } from "vis-data";

export default function NetworkGraph({
    graphData,
    nodeDetails,
    containerRef,
    networkRef,
    nodesRef,
    setGraphMounted,
    setSelectedNode,
    setSelectedEdgeId,
    setShowEdgePopup,
    setEdgePopupPosition,
    setIsDetailsVisible,
    setJustClosedRecently
}) {
    useEffect(() => {
        const processedNodes = graphData.nodes.map((node) => {
            const detail = nodeDetails?.[node.id];
            if (detail?.image) {
                return { ...node, shape: "circularImage", image: detail.image };
            }
            return { ...node, shape: "dot" };
        });
        
        const nodes = new DataSet(processedNodes);
        const edges = new DataSet(graphData.edges);
        nodesRef.current = nodes;
        setGraphMounted(true);

        const data = { nodes, edges };
        const options = {
            physics: {
                enabled: true,
                solver: "repulsion",
                repulsion: {
                    nodeDistance: 150,
                    centralGravity: 0.1,
                    springLength: 200,
                    springConstant: 0.05,
                    damping: 0.09
                },
                stabilization: {
                    iterations: 100,
                    fit: true
                }
            },
            layout: {
                improvedLayout: true
            },
            nodes: {
                shape: "dot",
                size: 30,
                font: { size: 10, color: "#333" },
                borderWidth: 2,
            },
            edges: {
                width: 2,
                color: { color: "#888" },
                arrows: {
                    to: { enabled: true, scaleFactor: 1 }
                },
                font: { align: "top" },
            },
            interaction: {
                multiselect: true,
                navigationButtons: true,
                selectConnectedEdges: false
            }
        };

        if (containerRef.current) {
            networkRef.current = new Network(containerRef.current, data, options);

            const handleRightClick = (e) => {
                e.preventDefault();
                const rect = containerRef.current.getBoundingClientRect();
                const pointer = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };

                const edgeId = networkRef.current.getEdgeAt(pointer);
                if (edgeId) {
                    setSelectedEdgeId(edgeId);
                    setShowEdgePopup(true);
                    setEdgePopupPosition({ x: e.clientX, y: e.clientY });
                } else {
                    setShowEdgePopup(false);
                    setSelectedEdgeId(null);
                }
            };

            containerRef.current.addEventListener("contextmenu", handleRightClick);
            networkRef.current.on("click", function (params) {
                if (params.nodes.length === 1) {
                    const nodeId = params.nodes[0];
                    setSelectedNode(nodeId);
                    setIsDetailsVisible(true);
                    setJustClosedRecently(true);
                } else {
                    setShowEdgePopup(false);
                    setSelectedEdgeId(null);
                    setIsDetailsVisible(false);
                    setSelectedNode(null);
                }
            });

            return () => {
                if (containerRef.current) {
                    containerRef.current.removeEventListener("contextmenu", handleRightClick);
                }
            };
        }
    }, [graphData]);
}