# Graph Recoloring

An interactive tool for exploring **graph coloring reconfiguration** — the study of how one valid graph coloring can be transformed into another through a sequence of single-vertex recolorings, each maintaining validity at every step.

![React](https://img.shields.io/badge/React-19.2-blue) ![Vite](https://img.shields.io/badge/Vite-7.2-purple) ![Go](https://img.shields.io/badge/Go-backend-cyan)

---

## The Mathematical Problem

### Graph Coloring

A **proper $k$-coloring** of a graph $G$ is a function $\varphi : V(G) \to \{1, \ldots, k\}$ such that $\varphi(u) \neq \varphi(v)$ whenever $uv \in E(G)$. The minimum $k$ for which a proper $k$-coloring exists is the **chromatic number** $\chi(G)$.

### Recoloring and the Reconfiguration Graph

Given a graph $G$ and a number $k \geq \chi(G)$, the **reconfiguration graph** $\mathcal{C}_k(G)$ is defined as:

- **Vertices:** all proper $k$-colorings of $G$
- **Edges:** two colorings $\alpha$ and $\beta$ are adjacent in $\mathcal{C}_k(G)$ if and only if they differ on exactly one vertex

Two colorings $\alpha$ and $\beta$ are **Kempe equivalent** (written $\alpha \sim_k \beta$) if they lie in the same connected component of $\mathcal{C}_k(G)$. The central question of graph coloring reconfiguration is:

> **Given two proper $k$-colorings $\alpha$ and $\beta$ of $G$, are $\alpha$ and $\beta$ Kempe equivalent — i.e., does a path exist in $\mathcal{C}_k(G)$ from $\alpha$ to $\beta$?**

Equivalently: can $\alpha$ be transformed into $\beta$ by recoloring one vertex at a time, keeping every intermediate state a valid proper coloring?

This problem is **PSPACE-complete** in general (Bonsma & Cereceda, 2009), even when $k = 3$.

### Frozen Colorings

A proper $k$-coloring $\varphi$ is **frozen** if it has no neighbors in $\mathcal{C}_k(G)$ — every vertex $v$ is surrounded by neighbors that collectively use all $k$ colors, so no single-vertex recoloring preserves validity. Frozen colorings are isolated vertices in $\mathcal{C}_k(G)$ and act as dead ends in any reconfiguration search.

A graph $G$ is **$k$-mixing** if $\mathcal{C}_k(G)$ is connected, i.e., every pair of proper $k$-colorings of $G$ are Kempe equivalent. Not all graphs are $k$-mixing for every $k \geq \chi(G)$.

### Kempe Chains

An **$(i,j)$-Kempe chain** under a coloring $\varphi$ is a component of the subgraph of $G$ induced by the vertices colored $i$ or $j$ by $\varphi$. Performing an **$(i,j)$-Kempe swap** on a chain $K$ — interchanging colors $i$ and $j$ on every vertex of $K$ — always produces another valid proper coloring. Kempe swaps thus provide a structured way to navigate $\mathcal{C}_k(G)$; two colorings reachable from each other by Kempe swaps are called **Kempe equivalent**, though a single Kempe swap may correspond to a multi-step path in the single-vertex recoloring model of $\mathcal{C}_k(G)$.

### Key Theoretical Results

| Result                                     | Statement                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Cereceda's Conjecture (2007)**           | For $k \geq \Delta(G) + 2$, the graph $\mathcal{C}_k(G)$ is connected and has diameter $O(n^2)$, where $\Delta(G)$ is the maximum degree. |
| **Cereceda–van den Heuvel–Johnson (2011)** | For $k \geq \Delta(G) + 2$, $\mathcal{C}_k(G)$ is connected (diameter bound proven; $O(n^2)$ still open in general).                      |
| **Bonsma–Cereceda (2009)**                 | Deciding reachability in $\mathcal{C}_3(G)$ is PSPACE-complete.                                                                           |
| **Bipartite graphs**                       | $\mathcal{C}_k(G)$ is connected for $k \geq 3$; for $k = 2 = \chi(G)$ there may be exactly two components.                                |
| **Trees**                                  | $\mathcal{C}_k(T)$ is connected for all $k \geq 3$; every tree is $k$-mixing for $k \geq 3$.                                              |
| **Chordal graphs**                         | $\mathcal{C}_k(G)$ is connected for $k \geq \chi(G) + 1$ (one extra color suffices).                                                      |

The gap between $\chi(G)$ and $\Delta(G) + 2$ is where the problem becomes most interesting: for $k = \chi(G)$ frozen colorings can appear, and for $\chi(G) < k < \Delta(G) + 2$ the connectivity of $\mathcal{C}_k(G)$ depends heavily on the structure of $G$.

---

## What This Tool Does

This app provides a hands-on environment for experimenting with these ideas on small graphs:

- **Build any graph** — place vertices and connect them with edges
- **Color vertices** from a palette of 6 colors, with real-time validity checking (no two adjacent vertices may share a color)
- **Record recoloring sequences** — log each step as you navigate from one coloring to another, with validity status at every intermediate state
- **Detect frozen states** — if no single recoloring keeps the graph valid, you have reached a frozen coloring
- **Export sessions** — save the full recoloring path (initial coloring → sequence → final coloring) to a text file

This makes it practical to:

- Manually search for a path between two colorings in $\mathcal{C}_k(G)$
- Construct examples of frozen colorings
- Verify whether a small graph is $k$-mixing for specific values of $k$
- Develop intuition for why more colors make reconfiguration easier

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
git clone https://github.com/your-username/Graph-Recoloring.git
cd Graph-Recoloring/frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Interface

### Modes

| Key | Mode       | Action                              |
| --- | ---------- | ----------------------------------- |
| `A` | Add Node   | Click canvas to place a vertex      |
| `E` | Add Edge   | Click two vertices to connect them  |
| `C` | Color Node | Select a color, then click a vertex |
| `D` | Delete     | Click a vertex or edge to remove it |

### Sidebar

- **Graph stats** — live count of vertices, edges, and colors in use
- **Validity badge** — shows whether the current coloring is a proper $k$-coloring and which $k$
- **Color palette** — 6 colors (mapped to abstract color classes $1$–$6$)
- **Recoloring log** — records each step; the recording can only start and stop from valid colorings so the log always represents a valid path in some $\mathcal{C}_k(G)$

---

## Suggested Experiments

### 1. Frozen colorings on $C_5$

Build the 5-cycle $C_5$ (vertices $v_1$–$v_5$ in a cycle). Color it properly with 3 colors. Try to recolor any single vertex. Can you reach every other valid 3-coloring, or do you get stuck? ($\mathcal{C}_3(C_5)$ is disconnected — not all 3-colorings of $C_5$ are Kempe equivalent.)

### 2. Kempe equivalence on trees

Build any tree and give it a proper 3-coloring. Because $\chi(T) = 2$ for non-trivial trees, $k = 3$ provides one extra color. Every tree is $3$-mixing — all proper 3-colorings of $T$ are Kempe equivalent, so $\mathcal{C}_3(T)$ is connected. Try to reach an arbitrary target 3-coloring from any starting coloring.

### 3. Extra color unlocks reconfiguration

Take a graph $G$ with $\chi(G) = 3$ and find two 3-colorings that cannot be reconfigured into each other (log shows a dead end). Now switch to 4 colors (re-color some vertices using the fourth color). The extra slack often connects the previously disconnected components.

### 4. Kempe swap as a multi-step path

Pick two colors $i$ and $j$, identify an $(i,j)$-Kempe chain, and perform the swap manually by recoloring each vertex in the chain one at a time. A Kempe swap is guaranteed to produce a valid coloring when completed atomically, but executing it one vertex at a time is not guaranteed to stay valid at every intermediate step — demonstrating why $\mathcal{C}_k(G)$ and the Kempe-swap reachability graph are not the same object.

---

## Project Structure

```
Graph-Recoloring/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # State management, validity checking, session logging
│   │   ├── components/
│   │   │   ├── Board.jsx    # Canvas rendering and pointer interaction
│   │   │   └── SideBar.jsx  # Controls, palette, log display
│   │   └── colors.js        # Color palette (6 colors)
│   └── package.json
└── backend/
    └── main.go              # Go backend (planned)
```

---

## References

- Bonsma, P. & Cereceda, L. (2009). [Finding paths between graph colourings: PSPACE-completeness and superpolynomial distances.](https://doi.org/10.1016/j.tcs.2009.07.038) _Theoretical Computer Science_, 410(50), 5215–5226.
- Cereceda, L., van den Heuvel, J. & Johnson, M. (2011). [Mixing 3-colourings in bipartite graphs.](https://doi.org/10.1016/j.ejc.2010.11.004) _European Journal of Combinatorics_, 32(2), 265–274.
- Cranston, D.W. & Mahmoud, R. (2022). [In most 6-regular toroidal graphs all 5-colorings are Kempe equivalent.](https://arxiv.org/abs/2102.07948) _arXiv:2102.07948_.
- Cranston, D.W. & Mahmoud, R. (2024). [Kempe equivalent list colorings.](https://arxiv.org/abs/2112.07439) _Combinatorica_.
- Cranston, D.W., Feghali, C. & Mahmoud, R. (2022). [List recoloring of sparse graphs.](https://arxiv.org/abs/2201.05133) _arXiv:2201.05133_.
- Nishimura, N. (2018). [Introduction to Reconfiguration.](https://doi.org/10.3390/a11040052) _Algorithms_, 11(4), 52. _(accessible survey)_
- van den Heuvel, J. (2013). [The complexity of change.](https://doi.org/10.1017/CBO9781139506748.003) In _Surveys in Combinatorics 2013_, Cambridge University Press.

---

## License

MIT
