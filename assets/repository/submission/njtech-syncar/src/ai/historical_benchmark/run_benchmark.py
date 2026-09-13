#!/usr/bin/env python
"""Run the locked R0--R2 historical-forward benchmark.  Round 3 is forbidden."""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
import pandas as pd

from src.data import ROOT, annotate, infer_background, load_round
from src.esm2 import ensure_mean_embeddings, mean_matrix, parse_mutation, zero_shot_scores
from src.models import FCNN_CONFIG, RF_PARAMS, SEEDS, fit_fcnn_predict, fit_rf_predict
from src.evaluate import correlations, topk
from src.plotting import plot_spearman

RESULTS, FIGURES = ROOT / "results", ROOT / "figures"
SPLITS = [("R0_to_R1", [0], 1), ("R0_to_R2", [0], 2), ("R0_R1_to_R2", [0, 1], 2)]

def main():
    RESULTS.mkdir(exist_ok=True); FIGURES.mkdir(exist_ok=True)
    rounds = {r: load_round(r) for r in (0, 1, 2)}  # There is no R3 code path.
    background = infer_background([s for r in rounds.values() for s in r.seq])
    rounds = {r: annotate(df, background) for r, df in rounds.items()}
    if any((df.mutation_order != 1).any() for df in rounds.values()):
        raise ValueError("R0--R2 must be one-new-mutation variants relative to their sequence consensus background")
    activity = pd.DataFrame([{"round":f"R{r}", "n":len(df), "best_activity":float(df.average.max()), "median_activity":float(df.average.median()), "fraction_above_psw":float((df.average > 1).mean())} for r, df in rounds.items()])
    all_rows = pd.concat(rounds.values(), ignore_index=True)
    requests=[]
    for row in all_rows.itertuples():
        ref, pos, alt = parse_mutation(row.mutations[0]); requests.append((background, pos, ref, alt))
    zero = zero_shot_scores(requests)
    all_rows["esm2_zero_shot"] = [zero[r] for r in requests]
    zero_by_hash = dict(zip(all_rows.sequence_hash, all_rows.esm2_zero_shot))
    ensure_mean_embeddings(all_rows.seq.tolist())
    prediction_frames, records = [], []
    for name, train_rounds, test_round in SPLITS:
        train = pd.concat([rounds[r] for r in train_rounds], ignore_index=True); test = rounds[test_round]
        xtr, xte = mean_matrix(train.seq.tolist()), mean_matrix(test.seq.tolist()); ytr, yte = train.average.to_numpy(float), test.average.to_numpy(float)
        zero_prediction = np.array([zero_by_hash[h] for h in test.sequence_hash]); rf, rf_std = fit_rf_predict(xtr, ytr, xte); fcnn, fcnn_std = fit_fcnn_predict(xtr, ytr, xte)
        methods = {"esm2_zero_shot":zero_prediction, "evolvepro_rf":rf, "fcnn":fcnn}
        for method, prediction in methods.items(): records.append({"split":name, "train_rounds":"+".join(f"R{r}" for r in train_rounds), "test_round":f"R{test_round}", "method":method, **correlations(yte,prediction), **topk(yte,prediction)})
        out = test[["name","seq","sequence_hash","average"]].copy().rename(columns={"average":"experimental"}); out.insert(0,"split",name); out["esm2_zero_shot"]=zero_prediction; out["evolvepro_rf"]=rf; out["evolvepro_rf_ensemble_std"]=rf_std; out["fcnn"]=fcnn; out["fcnn_ensemble_std"]=fcnn_std; prediction_frames.append(out)
    summary = pd.DataFrame(records); feedback = summary.pivot(index="method",columns="split",values="spearman").reset_index(); feedback["r1_feedback_delta_spearman"] = feedback.R0_R1_to_R2-feedback.R0_to_R2
    activity.to_csv(RESULTS / "round_activity_summary.csv",index=False); summary.to_csv(RESULTS / "historical_benchmark_master_table.csv",index=False); feedback.to_csv(RESULTS / "r1_feedback_comparison.csv",index=False); pd.concat(prediction_frames,ignore_index=True).to_csv(RESULTS / "historical_predictions.csv",index=False)
    protocol = {"allowed_rounds":[0,1,2], "round3_forbidden":True, "round2_used_for_hyperparameter_selection":False, "rf_fixed_params":RF_PARAMS, "fcnn_fixed_config":FCNN_CONFIG, "seeds":SEEDS, "esm2":"local esm2_t33_650M_UR50D", "topk":"k=5; overlap with experimental top-5 and predicted top-5 above PSW"}
    (RESULTS / "protocol.json").write_text(json.dumps(protocol,indent=2),encoding="utf-8")
    plot_spearman(summary, FIGURES)
    print(summary[["split","method","spearman","pearson","topk_overlap","topk_above_psw"]].to_string(index=False))

if __name__ == "__main__": main()
