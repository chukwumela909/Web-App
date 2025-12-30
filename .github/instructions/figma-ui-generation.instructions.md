---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.
 Add Figma UI generation guardrails:
- When reproducing UIs from screenshots, first create/duplicate a Figma page dedicated to the task and set the canvas frame size to match the target device/resolution.
- Use the Figma MCP tool to locate the exact frame/component by name or index; run extraction commands to retrieve frame size, spacing, typography (family, weight, size, line-height, letter-spacing), colors (including opacity), corner radii, shadows, auto-layout settings, and constraints. Capture component/variant metadata (states, interactions) when present.
- Use the MCP asset download commands to pull every linked raster/vector asset from the source file (icons, logos, illustrations, photos); never substitute or omit assets. If an asset is reused across frames, download once and reference consistently.
- Recreate the design in Figma with pixel-perfect fidelity: align to the measured positions, spacing, and layout rules; match fonts exactly (family/weight/style); use the extracted color tokens; preserve auto-layout, constraints, and grids; mirror interactions, hover/press states, and motion specs when provided.
- Keep naming conventions coherent: frames, layers, and components should mirror the source names; preserve variant/property naming for components.
- Verify completeness: compare against the screenshot and source frame to ensure no element is missing or altered; re-run MCP extractions if any value is uncertain. Avoid approximations—use the exact values returned by the MCP tool.
- Export/download assets at the same resolution/density as specified in the source file. Respect vector vs raster formats; do not upscale low-res assets—fetch originals via MCP.