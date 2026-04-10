export const locationData = {
    locations: [
        // ── ROAD NETWORK SKELETON (Intersections & Midpoints - Hidden) ──
        { id: "j_balp", name: "Ballupur Chowk", type: "center", lat: 30.3341, lon: 78.0000 },
        { id: "j_bind", name: "Bindal Bridge", type: "center", lat: 30.3275, lon: 78.0280 },
        { id: "j_kish", name: "Kishan Nagar", type: "center", lat: 30.3256, lon: 78.0158 },
        { id: "j_chak_mid", name: "Chakrata Rd Mid", type: "center", lat: 30.3380, lon: 77.9750 },
        { id: "j_dill", name: "Dillaram Chowk", type: "center", lat: 30.3400, lon: 78.0550 },
        { id: "j_raj_1", name: "Rajpur Road Curve 1", type: "center", lat: 30.3550, lon: 78.0650 },
        { id: "j_raj_2", name: "Rajpur Road Curve 2", type: "center", lat: 30.3750, lon: 78.0750 },
        { id: "j_prince", name: "Prince Chowk", type: "center", lat: 30.3175, lon: 78.0375 },
        { id: "j_shc", name: "Saharanpur Chowk", type: "center", lat: 30.3135, lon: 78.0325 },
        { id: "j_clem", name: "Clement Town Junction", type: "center", lat: 30.2820, lon: 78.0100 },
        { id: "j_mah", name: "Majra Junction", type: "center", lat: 30.2950, lon: 78.0100 },

        // ── LANDMARKS ─────────────────────────────────────────────
        { id: "geu",  name: "Graphic Era University", type: "center", lat: 30.2689, lon: 77.9931 },
        { id: "clk",  name: "Clock Tower", type: "center", lat: 30.3253, lon: 78.0413 },
        { id: "isbt", name: "ISBT Dehradun", type: "center", lat: 30.2892, lon: 77.9987 },
        { id: "bal",  name: "Balliwala Chowk", type: "center", lat: 30.3239, lon: 78.0113 },
        { id: "pac",  name: "Pacific Mall", type: "center", lat: 30.3665, lon: 78.0703 },
        { id: "itp",  name: "IT Park", type: "center", lat: 30.3684, lon: 78.0858 },
        { id: "pre",  name: "Prem Nagar", type: "center", lat: 30.3360, lon: 77.9621 },
        { id: "plt",  name: "Paltan Bazar", type: "pharmacy", lat: 30.3230, lon: 78.0426 },
        { id: "dnh",  name: "Doon Hospital", type: "hospital", lat: 30.3220, lon: 78.0437 },
        { id: "fri",  name: "FRI Museum", type: "center", lat: 30.3425, lon: 77.9927 },
        { id: "max",  name: "Max Hospital", type: "hospital", lat: 30.3853, lon: 78.0772 },
        { id: "sah",  name: "Sahastradhara", type: "center", lat: 30.3872, lon: 78.1311 },
        { id: "neh",  name: "Nehru Colony", type: "center", lat: 30.3058, lon: 78.0558 },
        { id: "ris",  name: "Rispana Bridge", type: "center", lat: 30.3013, lon: 78.0574 },
        { id: "sph",  name: "St. Paul Hospital", type: "hospital", lat: 30.3395, lon: 77.9621 },
        { id: "smih", name: "Indiresh Hospital", type: "hospital", lat: 30.3156, lon: 78.0264 },
        { id: "hpsn", name: "HP Pump", type: "fuel", lat: 30.3345, lon: 77.9960 },
        { id: "evck", name: "EV Station", type: "ev", lat: 30.3228, lon: 78.0366 },
        { id: "rly",  name: "Railway Station", type: "center", lat: 30.3159, lon: 78.0351 },
        { id: "gnp",  name: "Gandhi Park", type: "center", lat: 30.3284, lon: 78.0435 },
        { id: "srv",  name: "Survey Chowk", type: "center", lat: 30.3255, lon: 78.0526 },
        { id: "snj",  name: "Subhash Nagar Junc", type: "center", lat: 30.2725, lon: 77.9995 }
    ],
    connections: [
        // Road 1: Chakrata Road
        ["pre", "j_chak_mid"], ["j_chak_mid", "fri"], ["fri", "hpsn"], ["hpsn", "j_balp"], ["j_balp", "j_kish"], ["j_kish", "j_bind"], ["j_bind", "clk"],
        // Road 2: Rajpur Road
        ["clk", "gnp"], ["gnp", "j_dill"], ["j_dill", "j_raj_1"], ["j_raj_1", "pac"], ["pac", "itp"], ["itp", "j_raj_2"], ["j_raj_2", "max"], ["j_raj_1", "sah"],
        // Road 3: Saharanpur Road
        ["isbt", "j_mah"], ["j_mah", "snj"], ["snj", "j_clem"], ["j_clem", "geu"], ["j_clem", "sph"], ["isbt", "j_shc"], ["j_shc", "smih"], ["j_shc", "j_prince"],
        // Road 4: Haridwar Road
        ["clk", "plt"], ["plt", "j_prince"], ["j_prince", "rly"], ["j_prince", "dnh"], ["j_prince", "srv"], ["srv", "ris"], ["ris", "neh"], ["neh", "isbt"],
        // Cross-connects & Shortcuts
        ["srv", "gnp"], ["bal", "j_balp"], ["bal", "j_shc"], ["clk", "evck"]
    ]
};

export const typeColor: Record<string, string> = {
    hospital: "#ef4444",
    fuel: "#f59e0b",
    ev: "#10b981",
    pharmacy: "#8b5cf6",
    center: "#3b82f6"
};