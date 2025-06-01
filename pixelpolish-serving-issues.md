# PixelPolish UI Portal Serving Issues Log

This document outlines the troubleshooting steps and issues encountered while attempting to serve the PixelPolish UI Portal.

## Initial Setup and Build Issues

1.  **`dist` Directory Missing**:
    *   **Problem**: The initial attempt to use the `pixel-polish-server`'s `serve_vite_app` tool (with default `dist_path: "ui-portal/dist"`) failed because the `ui-portal/dist` directory did not exist.
    *   **Resolution**: The `ui-portal` Vite application needed to be built.

2.  **Vite Command Not Found**:
    *   **Problem**: Attempting to build the `ui-portal` application using `npm run build` (which executes `vite build`) failed with "sh: vite: command not found".
    *   **Resolution**: The project dependencies were not installed. Running `npm install` within the `ui-portal` directory resolved this.

3.  **Successful Build**:
    *   After installing dependencies, `npm run build` within `ui-portal` completed successfully, creating the `ui-portal/dist` directory.

## `serve_vite_app` Tool Issues

1.  **`dist_path` Resolution (Relative vs. Absolute)**:
    *   **Problem**: Even after a successful build, `serve_vite_app` (with `dist_path: "ui-portal/dist"`) still reported that the `dist` directory was not found.
    *   **Diagnosis**: The `pixel-polish-server` (MCP server) resolves relative paths from its own execution directory (`mcp_typescript/dist/`), not the project root.
    *   **Resolution**: The `dist_path` parameter for `serve_vite_app` needed to be an absolute path: `/Users/axel/Documents/GitHub/PixelPolish/ui-portal/dist/`.

2.  **"Internal Server Error" with `serve_vite_app`**:
    *   **Problem**: After successfully starting `serve_vite_app` with the correct absolute `dist_path`, accessing `http://localhost:8080` resulted in an "Internal Server Error".
    *   **Diagnosis**: The `ls -la` output confirmed files in `ui-portal/dist/` and `ui-portal/dist/assets/` existed with correct permissions. The issue was traced to the `pixel-polish-server`'s static file serving logic in `mcp_typescript/src/index.ts`. Specifically, the use of `path.join(dist_path, filePath)` where `filePath` (derived from `req.url`) often starts with a `/`. On POSIX systems, `path.join()` treats a segment starting with `/` as an absolute path, effectively discarding `dist_path`. This caused the server to look for files like `/index.html` at the filesystem root, leading to read errors.
    *   **Proposed Fix (not applied)**: Modify `mcp_typescript/src/index.ts` to ensure `filePath` is relative (by removing any leading `/`) before joining with `dist_path`.

## Alternative Serving Method

1.  **Using `npx serve`**:
    *   **Decision**: To bypass the issues with `serve_vite_app` and quickly get the UI Portal served, the user opted to use `npx serve`.
    *   **Action**: The `pixel-polish-server`'s HTTP server (if any was running) was stopped using `stop_vite_app`.
    *   **Command**: `cd ui-portal && npx serve -l 8081 .` was executed.
    *   **Result**: This successfully started a server on `http://localhost:8081`, serving the contents of the `ui-portal` directory. `http://localhost:8081/landing-page.html` became accessible.

## Current Status

*   The `ui-portal` is currently being served by `npx serve` on `http://localhost:8081`.
*   The `pixelpolish.mdc` automated workflow (which relies on `serve_vite_app` and subsequent `wait` calls) is paused due to the issues with `serve_vite_app`.
*   The underlying path resolution issue in `pixel-polish-server`'s `handleServeViteApp` function remains to be addressed for the MCP tool to function correctly.
