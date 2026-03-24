#include "graph_data.h"

#define PI 3.14159265358979323846

double get_distance(double lat1, double lon1, double lat2, double lon2) {
    double r = 6371; // Earth radius in km
    double dlat = (lat2 - lat1) * PI / 180.0;
    double dlon = (lon2 - lon1) * PI / 180.0;
    double a = sin(dlat / 2) * sin(dlat / 2) +
               cos(lat1 * PI / 180.0) * cos(lat2 * PI / 180.0) *
               sin(dlon / 2) * sin(dlon / 2);
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
}

int get_node_index(Graph* g, const char* id) {
    for (int i = 0; i < g->numNodes; i++) {
        if (strcmp(g->nodes[i].id, id) == 0) return i;
    }
    return -1;
}

void add_node(Graph* g, const char* id, const char* name, double lat, double lon, const char* facs[], int n_facs) {
    int i = g->numNodes++;
    strcpy(g->nodes[i].id, id);
    strcpy(g->nodes[i].name, name);
    g->nodes[i].lat = lat;
    g->nodes[i].lon = lon;
    g->nodes[i].numFacilities = n_facs;
    for(int j=0; j<n_facs; j++) strcpy(g->nodes[i].facilities[j], facs[j]);
    g->adj[i] = NULL;
}

void add_edge(Graph* g, const char* id1, const char* id2) {
    int u = get_node_index(g, id1);
    int v = get_node_index(g, id2);
    if (u == -1 || v == -1) return;

    double w = get_distance(g->nodes[u].lat, g->nodes[u].lon, g->nodes[v].lat, g->nodes[v].lon);

    AdjNode* newNode = (AdjNode*)malloc(sizeof(AdjNode));
    newNode->destIdx = v;
    newNode->weight = w;
    newNode->next = g->adj[u];
    g->adj[u] = newNode;

    newNode = (AdjNode*)malloc(sizeof(AdjNode));
    newNode->destIdx = u;
    newNode->weight = w;
    newNode->next = g->adj[v];
    g->adj[v] = newNode;
}

Graph* createGraph() {
    Graph* g = (Graph*)malloc(sizeof(Graph));
    g->numNodes = 0;
    for (int i = 0; i < MAX_NODES; i++) g->adj[i] = NULL;
    return g;
}

void loadDehradunData(Graph* g) {
    g->numNodes = 0;
    
    // Add nodes from constants.ts
    add_node(g, "clk", "Clock Tower", 30.3262, 78.0428, (const char*[]){}, 0);
    add_node(g, "plt", "Paltan Bazar", 30.3240, 78.0411, (const char*[]){"pharmacy"}, 1);
    add_node(g, "dnh", "Doon Hospital", 30.3246, 78.0355, (const char*[]){"hospital"}, 1);
    add_node(g, "ind", "Inder Road", 30.3285, 78.0314, (const char*[]){"fuel"}, 1);
    add_node(g, "isbt", "ISBT Dehradun", 30.3237, 78.0249, (const char*[]){"fuel"}, 1);
    add_node(g, "rly", "Railway Station", 30.3176, 78.0330, (const char*[]){}, 0);
    add_node(g, "srv", "Survey Chowk", 30.3165, 78.0322, (const char*[]){"fuel"}, 1);
    add_node(g, "max", "Max Hospital", 30.3201, 78.0452, (const char*[]){"hospital"}, 1);
    add_node(g, "dln", "Dalanwala", 30.3110, 78.0489, (const char*[]){}, 0);
    add_node(g, "ris", "Rispana Bridge", 30.3108, 78.0600, (const char*[]){}, 0);
    add_node(g, "bal", "Balliwala Chowk", 30.3004, 78.0507, (const char*[]){"fuel"}, 1);
    add_node(g, "neh", "Nehru Colony", 30.3015, 78.0377, (const char*[]){}, 0);
    add_node(g, "pac", "Pacific Mall", 30.3325, 78.0623, (const char*[]){"ev", "pharmacy"}, 2);
    add_node(g, "raj", "Rajpur Road", 30.3458, 78.0617, (const char*[]){"pharmacy"}, 1);
    add_node(g, "itp", "IT Park", 30.3508, 78.0876, (const char*[]){"ev"}, 1);
    add_node(g, "sah", "Sahastradhara", 30.3726, 78.1136, (const char*[]){}, 0);
    add_node(g, "rip", "Raipur", 30.3627, 78.0986, (const char*[]){}, 0);
    add_node(g, "fri", "FRI Museum", 30.3415, 77.9991, (const char*[]){}, 0);
    add_node(g, "pre", "Prem Nagar", 30.2833, 77.9972, (const char*[]){"fuel"}, 1);
    add_node(g, "clt", "Clement Town", 30.2884, 77.9825, (const char*[]){}, 0);

    // Add connections
    add_edge(g, "clk", "plt");
    add_edge(g, "clk", "max");
    add_edge(g, "clk", "dnh");
    add_edge(g, "plt", "dnh");
    add_edge(g, "dnh", "ind");
    add_edge(g, "ind", "isbt");
    add_edge(g, "isbt", "rly");
    add_edge(g, "rly", "srv");
    add_edge(g, "srv", "neh");
    add_edge(g, "max", "dln");
    add_edge(g, "dln", "ris");
    add_edge(g, "ris", "bal");
    add_edge(g, "bal", "neh");
    add_edge(g, "neh", "srv");
    add_edge(g, "clk", "pac");
    add_edge(g, "pac", "raj");
    add_edge(g, "raj", "itp");
    add_edge(g, "itp", "sah");
    add_edge(g, "sah", "rip");
    add_edge(g, "rip", "raj");
    add_edge(g, "isbt", "fri");
    add_edge(g, "fri", "pre");
    add_edge(g, "pre", "clt");
    add_edge(g, "clt", "neh");
}

void findShortestPath(Graph* g, char* startId, char* endId) {
    int startIdx = get_node_index(g, startId);
    int endIdx = get_node_index(g, endId);

    if (startIdx == -1 || endIdx == -1) {
        printf("{\"error\": \"Start or end node not found\"}\n");
        return;
    }

    double dists[MAX_NODES];
    int parents[MAX_NODES];
    extern void dijkstra(Graph* g, int start, double* dists, int* parents);
    dijkstra(g, startIdx, dists, parents);

    if (dists[endIdx] == DBL_MAX) {
        printf("{\"error\": \"No path found\"}\n");
        return;
    }

    // reconstruct path
    int path[MAX_NODES];
    int pathLen = 0;
    int curr = endIdx;
    while (curr != -1) {
        path[pathLen++] = curr;
        curr = parents[curr];
    }

    printf("{\"distance\": %f, \"path\": [", dists[endIdx]);
    for (int i = pathLen - 1; i >= 0; i--) {
        printf("\"%s\"%s", g->nodes[path[i]].id, (i == 0 ? "" : ", "));
    }
    printf("]}\n");
}

void findNearestFacility(Graph* g, char* startId, char* type) {
    int startIdx = get_node_index(g, startId);
    if (startIdx == -1) {
        printf("{\"error\": \"Start node not found\"}\n");
        return;
    }

    double dists[MAX_NODES];
    int parents[MAX_NODES];
    extern void dijkstra(Graph* g, int start, double* dists, int* parents);
    dijkstra(g, startIdx, dists, parents);

    int nearestIdx = -1;
    double minDist = DBL_MAX;

    for (int i = 0; i < g->numNodes; i++) {
        for (int j = 0; j < g->nodes[i].numFacilities; j++) {
            if (strcmp(g->nodes[i].facilities[j], type) == 0) {
                if (dists[i] < minDist) {
                    minDist = dists[i];
                    nearestIdx = i;
                }
            }
        }
    }

    if (nearestIdx == -1) {
        printf("{\"error\": \"No facility of this type found\"}\n");
        return;
    }

    // reconstruct path to nearest
    int path[MAX_NODES];
    int pathLen = 0;
    int curr = nearestIdx;
    while (curr != -1) {
        path[pathLen++] = curr;
        curr = parents[curr];
    }

    printf("{\"distance\": %f, \"path\": [", minDist);
    for (int i = pathLen - 1; i >= 0; i--) {
        printf("\"%s\"%s", g->nodes[path[i]].id, (i == 0 ? "" : ", "));
    }
    printf("]}\n");
}
