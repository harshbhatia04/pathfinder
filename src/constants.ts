export const locationData = {
    locations: [
        { id: "clk", name: "Clock Tower", type: "center", lat: 30.3262, lon: 78.0428 },
        { id: "plt", name: "Paltan Bazar", type: "pharmacy", lat: 30.3240, lon: 78.0411 },
        { id: "dnh", name: "Doon Hospital", type: "hospital", lat: 30.3246, lon: 78.0355 },
        { id: "ind", name: "Inder Road", type: "fuel", lat: 30.3285, lon: 78.0314 },
        { id: "isbt", name: "ISBT Dehradun", type: "fuel", lat: 30.3237, lon: 78.0249 },
        { id: "rly", name: "Railway Station", type: "center", lat: 30.3176, lon: 78.0330 },
        { id: "srv", name: "Survey Chowk", type: "fuel", lat: 30.3165, lon: 78.0322 },
        { id: "max", name: "Max Hospital", type: "hospital", lat: 30.3201, lon: 78.0452 },
        { id: "dln", name: "Dalanwala", type: "center", lat: 30.3110, lon: 78.0489 },
        { id: "ris", name: "Rispana Bridge", type: "center", lat: 30.3108, lon: 78.0600 },
        { id: "bal", name: "Balliwala Chowk", type: "fuel", lat: 30.3004, lon: 78.0507 },
        { id: "neh", name: "Nehru Colony", type: "center", lat: 30.3015, lon: 78.0377 },
        { id: "pac", name: "Pacific Mall", type: "ev", lat: 30.3325, lon: 78.0623 },
        { id: "raj", name: "Rajpur Road", type: "pharmacy", lat: 30.3458, lon: 78.0617 },
        { id: "itp", name: "IT Park", type: "ev", lat: 30.3508, lon: 78.0876 },
        { id: "sah", name: "Sahastradhara", type: "center", lat: 30.3726, lon: 78.1136 },
        { id: "rip", name: "Raipur", type: "center", lat: 30.3627, lon: 78.0986 },
        { id: "fri", name: "FRI Museum", type: "center", lat: 30.3415, lon: 77.9991 },
        { id: "pre", name: "Prem Nagar", type: "fuel", lat: 30.2833, lon: 77.9972 },
        { id: "clt", name: "Clement Town", type: "center", lat: 30.2884, lon: 77.9825 }
    ],
    connections: [
        ["clk", "plt"], ["clk", "max"], ["clk", "dnh"], ["plt", "dnh"], ["dnh", "ind"], 
        ["ind", "isbt"], ["isbt", "rly"], ["rly", "srv"], ["srv", "neh"], ["max", "dln"], 
        ["dln", "ris"], ["ris", "bal"], ["bal", "neh"], ["neh", "srv"], ["clk", "pac"], 
        ["pac", "raj"], ["raj", "itp"], ["itp", "sah"], ["sah", "rip"], ["rip", "raj"], 
        ["isbt", "fri"], ["fri", "pre"], ["pre", "clt"], ["clt", "neh"]
    ]
};

export const typeColor: Record<string, string> = {
    hospital: "#ef4444",
    fuel: "#f59e0b",
    ev: "#10b981",
    pharmacy: "#8b5cf6",
    center: "#3b82f6"
};