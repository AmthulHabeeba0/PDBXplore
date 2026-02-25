import numpy as np
import matplotlib.pyplot as plt
from Bio.PDB import PDBParser, PPBuilder
from scipy.stats import gaussian_kde
import matplotlib
matplotlib.use("Agg")


def generate_ramachandran_plot(pdb_path, output_path):

    # ==========================
    # PARSE STRUCTURE
    # ==========================

    parser = PDBParser(QUIET=True)
    structure = parser.get_structure("protein", pdb_path)

    phi_vals = []
    psi_vals = []

    for model in structure:
        for chain in model:
            polypeptides = PPBuilder().build_peptides(chain)
            for poly in polypeptides:
                for phi, psi in poly.get_phi_psi_list():
                    if phi is not None and psi is not None:
                        phi_vals.append(np.degrees(phi))
                        psi_vals.append(np.degrees(psi))

    phi_vals = np.array(phi_vals)
    psi_vals = np.array(psi_vals)

    total_residues = len(phi_vals)

    if total_residues == 0:
        raise ValueError("No phi/psi angles found in structure")

    # ==========================
    # CLASSIFICATION
    # ==========================

    favored_count = 0
    allowed_count = 0
    outlier_count = 0

    favored_points = []
    outlier_points = []

    for phi, psi in zip(phi_vals, psi_vals):

        # Alpha helix region
        if (-160 <= phi <= -40 and -80 <= psi <= 45):
            favored_count += 1
            favored_points.append((phi, psi))

        # Beta sheet region
        elif (-180 <= phi <= -40 and 90 <= psi <= 180):
            favored_count += 1
            favored_points.append((phi, psi))

        # Generously allowed
        elif (-180 <= phi <= -30 and -180 <= psi <= 180):
            allowed_count += 1

        else:
            outlier_count += 1
            outlier_points.append((phi, psi))

    favored_pct = round((favored_count / total_residues) * 100, 2)
    allowed_pct = round((allowed_count / total_residues) * 100, 2)
    outlier_pct = round((outlier_count / total_residues) * 100, 2)

    # ==========================
    # KDE DENSITY MAP
    # ==========================

    xy = np.vstack([phi_vals, psi_vals])
    kde = gaussian_kde(xy, bw_method=0.15)

    phi_grid, psi_grid = np.mgrid[-180:180:300j, -180:180:300j]
    grid_coords = np.vstack([phi_grid.ravel(), psi_grid.ravel()])
    density = kde(grid_coords)
    density = density.reshape(phi_grid.shape)

    density /= density.max()

    # ==========================
    # PLOT
    # ==========================

    plt.figure(figsize=(8, 8))

    levels = [0.02, 0.08, 0.20, 0.40, 1.0]

    plt.contourf(
        phi_grid,
        psi_grid,
        density,
        levels=levels,
        colors=[
            "#fff9cc",   # very light
            "#ffff66",   # light yellow
            "#ffcc00",   # yellow
            "#ff9933",   # orange
            "#cc0000"    # red (most favored)
        ]
    )

    # Plot residues
    if favored_points:
        fp = np.array(favored_points)
        plt.scatter(fp[:, 0], fp[:, 1], c="black", s=10)

    if outlier_points:
        op = np.array(outlier_points)
        plt.scatter(op[:, 0], op[:, 1], c="red", s=25)

    plt.axhline(0, color="black", linewidth=0.6)
    plt.axvline(0, color="black", linewidth=0.6)

    plt.xlim(-180, 180)
    plt.ylim(-180, 180)

    plt.xticks([-180,-120,-60,0,60,120,180])
    plt.yticks([-180,-120,-60,0,60,120,180])

    plt.xlabel("Phi (degrees)")
    plt.ylabel("Psi (degrees)")
    plt.title("Ramachandran Plot")

    # Right-side legend
    plt.text(
        190, 140,
        f"Most Favoured: {favored_pct}%\n"
        f"Additionally Allowed: {allowed_pct}%\n"
        f"Outliers: {outlier_pct}%\n\n"
        f"Black dots = Low steric hindrance\n"
        f"Red dots = High steric hindrance",
        fontsize=9,
        verticalalignment="top"
    )

    plt.subplots_adjust(right=0.75)
    plt.grid(True, linestyle="--", linewidth=0.3)

    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()

    return {
        "total_residues": total_residues,
        "favored_count": favored_count,
        "allowed_count": allowed_count,
        "outlier_count": outlier_count,
        "allowed_percentage": round(((favored_count + allowed_count) / total_residues) * 100, 2)
    }
