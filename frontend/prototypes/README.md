# CBOMkit frontend redesign preview

This is a static interaction draft for the proposed Svelte 5 frontend. It uses IBM Carbon Web Components from the CDN and local sample data. It makes no backend requests.

To view it locally from the repository root:

```sh
python3 -m http.server 8765 --directory frontend/prototypes
```

Open `http://localhost:8765/svelte-redesign.html` in a browser. The Scan, Scans, Inventory, and Results views are clickable. Scans pagination and the inventory upload interaction are local examples of the proposed UI; they are not connected to the current API.
