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
    setJustClosedRecently,
    isDarkMode
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
                solver: "forceAtlas2Based", // or still "repulsion" if you prefer
                stabilization: {
                    iterations: 150, // let it settle more
                    fit: true
                },
                // ForceAtlas2 has a built-in way to avoid crowding
                forceAtlas2Based: {
                    gravitationalConstant: -50,   // push apart
                    centralGravity: 0.01,
                    springLength: 200,
                    springConstant: 0.05,
                    avoidOverlap: 1               // <--- this is important
                }
            },
            layout: {
                improvedLayout: true
            },
            nodes: {
                shape: "dot",
                size: 30,
                font: {
                    size: 10,
                    color: isDarkMode ? "#fff" : "#333"
                },
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
    }, [graphData, nodeDetails, isDarkMode]);
}