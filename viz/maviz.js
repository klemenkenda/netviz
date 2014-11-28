

var MAViz = function (opts) {
	var url = opts.url;
	var networkContainer = document.getElementById(opts.networkContainer);
	var treeContainer = document.getElementById(opts.treeContainer);
	
	var treeNodes = new vis.DataSet();
	var treeEdges = new vis.DataSet();
	var networkNodes = new vis.DataSet();
	var networkEdges = new vis.DataSet();

	var P = [];
	var map = {};
	var rmap = {};
	var lastChanged;
	var oldNode;
	
	var treeData = {
		nodes: treeNodes,
		edges: treeEdges
	};
	
	var networkData= {
		nodes: networkNodes,
		edges: networkEdges
	};
	
	var groupsTable = [];
	
	var networkOptions = {
		edges: {
			style: "arrow",
			arrowScaleFactor: 0.4,
			widthMax: 6
		},
		nodes: {
			fontSize: 20
		},
		physics: {
			barnesHut: {
				springLength: 150
			}
		},
	    groups: {
	        0: {
	            shape: 'dot',
	            color: {
	                border: 'yellow',
	                background: 'orange',
	                highlight: {
	                    border: 'orange',
	                    background: 'yellow'
	                }
	            }
	        },
	        1: {
	            shape: 'dot',
	            color: {
	                border: 'black',
	                background: 'white'
	            }
	        },
            fontColor: 'red',
            fontSize: 20
	    },
    };
	
	var treeOptions = {
		hierarchicalLayout: {
			layout: "direction"
		},
		edges: {
			style: "arrow",
			arrowScaleFactor: 0.4
		},
		nodes: {
			color: {
				background: "#97C2FC",
				highlight: {
					background: "#00FF00"
				}
			}
		}
	};
	
	function onNetworkDoubleClick(properties) {
		alert("double click");
	}
	
	function onTreeDoubleClick(properties) {
		constructNetwork(properties.nodes[0]);
	}
	
	function onTreeSelect(properties) {
	    if (properties.nodes[0]) {
			constructNetwork(properties.nodes[0]);
		}
	}
	
	function onNetworkSelect(properties) {
	    var clickedId = properties.nodes[0];
	    oldNode = -1; // will crash the program, if not defined again
	    if (clickedId) {
	        if (lastChanged && networkData.nodes._data[lastChanged]) {
	            oldNode = networkData.nodes._data[lastChanged];
	            oldNode.group = 0;
	            networkData.nodes.update(oldNode);
	            //console.log(networkData.nodes._data[lastChanged]);
	        }
	        //console.log(map[clickedId]);
	        var rootpomo = mostProbablePredecessor1(P, map[clickedId], 9);
	        if (rootpomo == -1) {
	            return;
	        }
	        var rootId = rmap[rootpomo.where];
	        //console.log(clickedId, map[clickedId], rootpomo.where, rootId);
	        oldNode = networkData.nodes._data[rootId];
	        oldNode.group = 1;
	        networkData.nodes.update(oldNode);

	        lastChanged = rootId;
	        
	        //console.log(networkData.nodes._data[rmap[rootId]]);


			//alert("node selected - x, y: " + properties.nodes[0].x + ", " + properties.nodes[0].y);
	    }
	    else {
	        if (lastChanged) {
	            oldNode = networkData.nodes._data[lastChanged];
	            oldNode.group = 0;
	            networkData.nodes.update(oldNode);
	            //console.log(networkData.nodes._data[lastChanged]);
	        }
	    }
	}
	
	function addEdgeToTree(id, childId) {
		treeEdges.add({from: id, to: childId, width: 3});
	}
	
	function addNodesAndEdgesToTree(jsonObject) {
		treeNodes.add({id: jsonObject.id, label: "" + jsonObject.id, childrenActive: false});
		groupsTable.push({id: jsonObject.id, states: jsonObject.states, intensities: jsonObject.intensities});
		
		for (var i = 0; i < jsonObject.children.length; i++) {
			addNodesAndEdgesToTree(jsonObject.children[i]);
			addEdgeToTree(jsonObject.id, jsonObject.children[i].id);
		}
	}
	
	function constructNetwork(clickedId) {
		networkData.nodes.clear();
		networkData.edges.clear();

		P = [];
		map = {};
		ramp = {};
		var pomo;
		
		for (var i = 0; i < groupsTable.length; i++) {
		    if (groupsTable[i].id == clickedId) {
		        //compute most probable cause
		        for (var j = 0; j < groupsTable[i].states.length; j++) {
		            pomo = [];
		            map[groupsTable[i].states[j].id] = j;
		            rmap[j] = groupsTable[i].states[j].id; // could be the same map, but this is easier to understand
		            for (var k = 0; k < groupsTable[i].states.length; k++) {
		                if (groupsTable[i].intensities[j][k] >= 0) {
		                    pomo.push(groupsTable[i].intensities[j][k]);
		                }
		                else {
		                    pomo.push(0);
		                }
		            }
		            P.push(pomo);
		        }
		        P = normMatrix(P);
		        
		        // add nodes
		        for (var j = 0; j < groupsTable[i].states.length; j++) {
		            var centroidtitle = "";
		            for (var ii = 0; ii < groupsTable[i].states[j].centroid.length; ii++) {
		            	centroidtitle += (groupsTable[i].states[j].centroid[ii].name + ": " + groupsTable[i].states[j].centroid[ii].value) + "<br>";
		            }
					networkData.nodes.add({id: groupsTable[i].states[j].id, shape: "dot", value: groupsTable[i].states[j].size, 
										label: "" + groupsTable[i].states[j].id, 
										title: centroidtitle,
					                    group: 0});
				}
				
				//add edges
				for (var x = 0; x < groupsTable[i].intensities.length; x++) {
					for (var y = 0; y < groupsTable[i].intensities[x].length; y++) {
						if (groupsTable[i].intensities[x][y] > 0) {
							var a = groupsTable[i].states[x].id;
							var b = groupsTable[i].states[y].id;
							networkData.edges.add({from: a, to: b, value: groupsTable[i].intensities[x][y],
											label: "" + groupsTable[i].intensities[x][y].toFixed(2)});
						}
					}
				}
			}
		}
	}
	
	function draw(dataJson) {
		treeNodes = new vis.DataSet();
		treeEdges = new vis.DataSet();
		networkNodes = new vis.DataSet();
		networkEdges = new vis.DataSet();
		
		groupsTable = [];
		
		addNodesAndEdgesToTree(dataJson);

		//console.log(treeNodes);

		treeData = {
			nodes: treeNodes,
			edges: treeEdges
		};
		
		networkData= {
			nodes: networkNodes,
			edges: networkEdges
		};
		
		var network = new vis.Network(networkContainer, networkData, networkOptions);
		var tree = new vis.Network(treeContainer, treeData, treeOptions);
		
		tree.on('select', onTreeSelect);
		tree.on('doubleClick', onTreeDoubleClick);
		network.on('select', onNetworkSelect);
		network.on('doubleClick', onNetworkDoubleClick);
	}
	
	var that = {
		refresh: function () {
			//$.ajax({
			//	url: url,
			//	data: { },
			//	success: function (data) {
			//		draw(data);
			//	},	
			//	dataType: 'json',
			//	error: function (jqXHR, jqXHR, status, err) {
			//		alert("failed to receive object: " + status + ", " + err);
			//	}
			//});
			data = testJSON;
			draw(data);
		}
		
	}
	
	return that;
}

function mostProbablePredecessor(P, node, maxSteps) {
    if (maxSteps > 9) {
        alert("maxSteps is too big, computing could take ages.");
        return;
    }
    var stepMax;
    var Q = P;
    var max = 0;
    var where = -1;
    var step = 1;

    var col = getCol(P, node);
    stepMax = arrayMax(col);
    if (stepMax.where == -1) {
        alert("ERROR matrix invalid");
        return;
    }
    if (max < stepMax.max) {
        max = stepMax.max;
        where = stepMax.where;
    }

    for (var i = 2; i < maxSteps; i++) {
        Q = numeric.dot(Q, P);
        col = getCol(Q, node);
        stepMax = maxArray(col);
        if (stepMax.where == -1) {
            alert("ERROR matrix invalid");
            return;
        }
        if (max < stepMax.max) {
            max = stepMax.max;
            where = stepMax.where;
            step = i;
        }
    }
    if (max == 0) {
        alert("This node cannot be accesed, so it has not root cause.");
        return -1;
    }
    return { 'max': max, 'where': [where, node], 'numberOfSteps': step, 'maxSteps': maxSteps };
}

function mostProbablePredecessor1(P, node, maxSteps) {
    // computes the most porbable root cause of node, with transition matrix P, using up to maxSteps steps
    //console.log(P, node);
    if (maxSteps > 9) {
        alert("maxSteps is too big, computing could take ages.");
        return;
    }
    var stepMax;
    var Q = P;
    var prob = [];
    for (var i = 0; i < P.length; i++) {
        prob.push(0);
    }

    var col = getCol(P, node);
    prob = arrayPlus(prob, col);

    for (var i = 2; i < maxSteps; i++) {
        Q = numeric.dot(Q, P);
        col = getCol(Q, node);
        prob = arrayPlus(prob, col);
    }
    //console.log(prob, arrayMax(prob));
    if (sumArray(prob) == 0) {
        alert("This node cannot be accesed, so it has not root cause.");
        return -1;
    }
    return arrayMax(prob);
}

function divideWithConstant(array, num) {
    for (var i = 0; i < array.length; i++) {
        array[i] = array[i] / num;
    }
    return array;
}

function normMatrix(P) {
    var summ = 0;
    for (var i = 0; i < P.length; i++) {
        summ = sumArray(P[i]);
        if (summ != 0) {
            P[i] = divideWithConstant(P[i], summ);
        }
        else {
            P[i][i] = 1; //since P has to be a markov chain we must send i somewhere. Because it has no connections out, the only option is to send it back into itself.
        }
    }
    return P;
}

function arrayPlus(l1, l2) {
    if (l1.length != l2.length) {
        alert("ERROR lengths must match");
        return;
    }
    for (var i = 0; i < l1.length; i++) {
        l1[i] = l1[i] + l2[i];
    }
    return l1;
}

function getCol(P, i) {
    var col = [];
    for (var j = 0; j < P.length; j++) {
        col.push(P[j][i]);
    }
    return col;
}

function sumArray(col) {
    var sum = 0;
    for (var i = 0; i < col.length; i++) {
        sum = sum + col[i];
    }
    return sum;
}

function arrayMax(col) {
    var max = 0;
    var where = -1;
    for (var i = 0; i < col.length; i++) {
        if (col[i] > max) {
            max = col[i];
            where = i;
        }
    }
    return {'max': max / sumArray(col), 'where': where};
}
