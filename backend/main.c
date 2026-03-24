#include "graph_data.h"

extern void dijkstra(Graph* g, int src, double* dist, int* prev);

int main(int argc, char* argv[]) {
    if (argc < 4) {
        printf("{\"error\": \"Usage: ./dijkstra.exe <mode> <start_id> <end_id_or_type>\"}\n");
        return 1;
    }

    Graph* g = createGraph();
    loadDehradunData(g);

    if (strcmp(argv[1], "path") == 0 && argc == 4) {
        char* startId = argv[2];
        char* endId = argv[3];
        findShortestPath(g, startId, endId);
    }
    else if (strcmp(argv[1], "facility") == 0 && argc == 4) {
        char* startId = argv[2];
        char* type = argv[3];
        findNearestFacility(g, startId, type);
    }
    else {
        printf("{\"error\": \"Unknown command\"}\n");
    }

    return 0;
}
