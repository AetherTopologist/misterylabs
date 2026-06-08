/**
 * ObservatoryForceGraph
 *
 * The new primary Atlas visualization for MisterY Labs.
 * 
 * Uses react-force-graph-3D to deliver a living, cosmic, personal force-directed graph
 * that matches the visual reference: central glowing xPRIMEray node as the point of
 * elegant convergence, Bell Labs as the Engineering Cathedral, personal resonance nodes
 * and key thinkers orbiting with soft glowing connections.
 *
 * Strongly aligned with the existing cosmic/diagnostic aesthetic (cyan + amber glows,
 * dark backgrounds, precise technical poetry).
 */

import { useState } from "react";
import { ForceGraph3D } from "react-force-graph-3d";
import * as THREE from "three";
import { getAtlasGraphData, type AtlasGraphNode, type AtlasGraphLink, ATLAS_GRAPH_TIERS } from "@/lib/atlasGraph";
import { useTheme } from "@/hooks/useTheme";

interface ObservatoryForceGraphProps {
  onNodeSelect?: (node: AtlasGraphNode | null) => void;
  selectedNodeId?: string | null;
}

export function ObservatoryForceGraph({ onNodeSelect, selectedNodeId }: ObservatoryForceGraphProps) {
  const { theme } = useTheme();
  const { nodes, links } = getAtlasGraphData();

  // Convert to the format react-force-graph expects
  const graphData = {
    nodes: nodes.map((n) => ({
      ...n,
      // color is handled in nodeThreeObject for full glow control
    })),
    links,
  };

  // Custom glowing orb renderer — the heart of the cosmic aesthetic
  const nodeThreeObject = (node: any) => {
    const tier = node.tier as AtlasGraphNode["tier"];
    const tierStyle = ATLAS_GRAPH_TIERS[tier] || ATLAS_GRAPH_TIERS["technical-lineage"];

    const group = new THREE.Group();

    // Base sphere (core of the glowing orb)
    const geometry = new THREE.SphereGeometry(Math.sqrt(node.val || 2.5) * 1.8, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: tierStyle.color,
      emissive: tierStyle.color,
      emissiveIntensity: tier === "core" ? 0.9 : tier === "personal-resonance" ? 0.65 : 0.45,
      shininess: 12,
      transparent: true,
      opacity: tier === "core" ? 0.95 : 0.85,
    });

    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Outer soft glow shell (larger, lower opacity) — creates the "glowing orb" look from the reference
    const glowGeometry = new THREE.SphereGeometry(Math.sqrt(node.val || 2.5) * 3.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: tierStyle.color,
      transparent: true,
      opacity: tier === "core" ? 0.18 : tier === "personal-resonance" ? 0.14 : 0.09,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Special treatment for the central xPRIMEray node — more pronounced glow + subtle inner structure
    if (tier === "core") {
      const innerGeom = new THREE.SphereGeometry(2.2, 32, 32);
      const innerMat = new THREE.MeshPhongMaterial({
        color: "#ffffff",
        emissive: "#a5f3fc",
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.4,
      });
      const inner = new THREE.Mesh(innerGeom, innerMat);
      group.add(inner);

      // Very subtle outer halo for the core
      const haloGeom = new THREE.SphereGeometry(7, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: "#67e8f9",
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
      });
      group.add(new THREE.Mesh(haloGeom, haloMat));
    }

    // Slightly larger / warmer treatment for Bell Labs (the "Cathedral")
    if (node.id === "bell-labs") {
      const cathedralGlow = new THREE.Mesh(
        new THREE.SphereGeometry(Math.sqrt(node.val || 4) * 4.5, 32, 32),
        new THREE.MeshBasicMaterial({
          color: "#fbbf24",
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
        })
      );
      group.add(cathedralGlow);
    }

    return group;
  };

  const handleNodeClick = (node: any) => {
    const fullNode = nodes.find((n) => n.id === node.id);
    onNodeSelect?.(fullNode || null);
  };

  return (
    <div className="relative w-full h-full bg-background rounded-sm overflow-hidden border border-border/20">
      <ForceGraph3D
        graphData={graphData}
        nodeThreeObject={nodeThreeObject}
        nodeLabel={(n: any) => `${n.name} — ${ATLAS_GRAPH_TIERS[n.tier as AtlasGraphNode["tier"]]?.label}`}
        linkColor={() => "rgba(103, 232, 249, 0.25)"}
        linkWidth={0.6}
        linkOpacity={0.6}
        onNodeClick={handleNodeClick}
        backgroundColor={theme === 'light' ? '#fafafa' : '#05060c'}
        showNavInfo={false}
        enableNodeDrag={true}
        enableNavigationControls={true}
        cooldownTicks={120} // let it settle into a nice living configuration
        // Initial camera position — looking at the convergence
        onEngineStop={() => {
          // Optional: auto-position camera nicely once layout settles
        }}
      />

      {/* Subtle cosmic overlay hint (can be enhanced with real starfield later) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#111_0.5px,transparent_1px)] bg-[length:3px_3px] opacity-40" />
    </div>
  );
}
