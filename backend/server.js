const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/bfhl', (req, res) => {
  return res.status(200).json({ operation_code: 1 });
});

app.post('/bfhl', (req, res) => {
  try {
    const body = req.body;
    if (!body || !Array.isArray(body.data)) {
      return res.status(400).json({ is_success: false, message: "Invalid payload format. Expected { data: [...] }" });
    }

    const { data } = body;

    const invalid_entries = [];
    const duplicate_edges = [];
    const unique_edges = [];
    const seen_edges = new Set();
    const reported_duplicates = new Set();

    // 1. Parse and Validate
    for (let s of data) {
      if (typeof s !== 'string') {
        invalid_entries.push(String(s));
        continue;
      }
      const trimmed = s.trim();
      const match = trimmed.match(/^([A-Z])->([A-Z])$/);
      
      if (!match || match[1] === match[2]) {
        invalid_entries.push(s);
      } else {
        if (seen_edges.has(trimmed)) {
          if (!reported_duplicates.has(trimmed)) {
            duplicate_edges.push(trimmed);
            reported_duplicates.add(trimmed);
          }
        } else {
          seen_edges.add(trimmed);
          unique_edges.push({ u: match[1], v: match[2], original: trimmed });
        }
      }
    }

    // 2. Build Tree Edges (Multi-parent rule)
    const tree_edges = [];
    const parent_of = {};

    for (let { u, v } of unique_edges) {
      if (parent_of[v]) {
        continue;
      } else {
        parent_of[v] = u;
        tree_edges.push({ u, v });
      }
    }

    // 3. Find Weakly Connected Components
    const adj = {};
    const nodesSet = new Set();

    // Add all valid nodes before discarding edges to preserve isolated nodes
    for (let { u, v } of unique_edges) {
      nodesSet.add(u);
      nodesSet.add(v);
    }

    for (let { u, v } of tree_edges) {
      if (!adj[u]) adj[u] = [];
      if (!adj[v]) adj[v] = [];
      adj[u].push(v);
      adj[v].push(u); // undirected
    }

    const visited = new Set();
    const components = [];

    for (let node of nodesSet) {
      if (!visited.has(node)) {
        const comp_nodes = [];
        const q = [node];
        visited.add(node);

        while (q.length > 0) {
          const curr = q.shift();
          comp_nodes.push(curr);
          if (adj[curr]) {
            for (let neighbor of adj[curr]) {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                q.push(neighbor);
              }
            }
          }
        }
        components.push(comp_nodes);
      }
    }

    const hierarchies = [];
    let total_trees = 0;
    let total_cycles = 0;
    let maxDepth = -1;
    let largest_tree_root = null;

    // 4. Process Components
    for (let comp_nodes of components) {
      const indegree = {};
      const out_adj = {};

      for (let n of comp_nodes) {
        indegree[n] = 0;
        out_adj[n] = [];
      }

      for (let { u, v } of tree_edges) {
        if (comp_nodes.includes(u)) {
          out_adj[u].push(v);
          indegree[v]++;
        }
      }

      const roots = comp_nodes.filter(n => indegree[n] === 0);

      if (roots.length === 1) {
        const root = roots[0];
        
        const build_tree = (node) => {
          const obj = {};
          const children = out_adj[node].sort();
          for (let child of children) {
            obj[child] = build_tree(child);
          }
          return obj;
        };

        const calc_depth = (node) => {
          if (!out_adj[node] || out_adj[node].length === 0) return 1;
          let max = 0;
          for (let child of out_adj[node]) {
            max = Math.max(max, calc_depth(child));
          }
          return max + 1;
        };

        const treeObj = {};
        treeObj[root] = build_tree(root);
        const depth = calc_depth(root);

        hierarchies.push({ root, tree: treeObj, depth });
        total_trees++;

        if (depth > maxDepth) {
          maxDepth = depth;
          largest_tree_root = root;
        } else if (depth === maxDepth) {
          if (!largest_tree_root || root < largest_tree_root) {
            largest_tree_root = root;
          }
        }
      } else {
        comp_nodes.sort();
        const root = comp_nodes[0];
        hierarchies.push({ root, tree: {}, has_cycle: true });
        total_cycles++;
      }
    }

    hierarchies.sort((a, b) => a.root.localeCompare(b.root));

    const responseData = {
      user_id: "johndoe_17091999",
      email_id: "john.doe@college.edu",
      college_roll_number: "21CS1001",
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees,
        total_cycles,
        largest_tree_root: largest_tree_root || null
      }
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ is_success: false, message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
