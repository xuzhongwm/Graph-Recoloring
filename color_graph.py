import networkx as nx
from typing import Protocol, Iterable, Hashable

# Graph data structure interface
class GraphLike(Protocol):
    def nodes(self) -> Iterable[Hashable]: ...

    def neighbors(self, v: Hashable) -> Iterable[Hashable]: ...

# Graph work from an networkx adapter
class Graph:
    def __init__(self, nodes: Iterable[Hashable], edges: Iterable[tuple[Hashable, Hashable]]):
        self.G = nx.Graph()
        self.G.add_nodes_from(nodes)
        self.G.add_edges_from(edges)

    def node(self) -> Iterable[Hashable]:
        return self.G.nodes()

    def neighbors(self, v: Hashable) -> Iterable[Hashable]:
        return self.G.neighbors

if __name__ == "__main__":
    print()