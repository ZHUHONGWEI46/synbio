"""Fixed, low-sample EvolvePro-style RF and FCNN models."""
from __future__ import annotations

import random
import numpy as np
import torch
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

SEEDS = [11, 22, 33, 44, 55]
RF_PARAMS = {"n_estimators": 500, "max_features": 0.2, "min_samples_leaf": 2, "max_depth": 5}
FCNN_CONFIG = {"hidden": 32, "dropout": 0.20, "weight_decay": 1e-2, "lr": 7e-4, "epochs": 150}


def _seed(seed: int) -> None:
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
    if torch.cuda.is_available(): torch.cuda.manual_seed_all(seed)


def fit_rf_predict(x_train, y_train, x_test):
    values = []
    for seed in SEEDS:
        model = RandomForestRegressor(**RF_PARAMS, random_state=seed, n_jobs=-1)
        model.fit(x_train, y_train); values.append(model.predict(x_test))
    values = np.vstack(values)
    return values.mean(axis=0), values.std(axis=0)


class FCNN(torch.nn.Module):
    def __init__(self, n_features: int):
        super().__init__()
        self.layers = torch.nn.Sequential(torch.nn.Linear(n_features, FCNN_CONFIG["hidden"]), torch.nn.GELU(), torch.nn.Dropout(FCNN_CONFIG["dropout"]), torch.nn.Linear(FCNN_CONFIG["hidden"], 1))
    def forward(self, x): return self.layers(x).squeeze(-1)


def fit_fcnn_predict(x_train, y_train, x_test):
    """Five-seed ensemble; preprocessing is fitted only on the split's train rows."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    scaler = StandardScaler().fit(x_train)
    xt = torch.tensor(scaler.transform(x_train), dtype=torch.float32, device=device)
    xe = torch.tensor(scaler.transform(x_test), dtype=torch.float32, device=device)
    mean, std = float(np.mean(y_train)), float(np.std(y_train) or 1.0)
    yt = torch.tensor((y_train - mean) / std, dtype=torch.float32, device=device)
    values = []
    for seed in SEEDS:
        _seed(seed); model = FCNN(x_train.shape[1]).to(device)
        optimizer = torch.optim.AdamW(model.parameters(), lr=FCNN_CONFIG["lr"], weight_decay=FCNN_CONFIG["weight_decay"])
        for _ in range(FCNN_CONFIG["epochs"]):
            model.train(); optimizer.zero_grad(); torch.nn.functional.mse_loss(model(xt), yt).backward(); optimizer.step()
        model.eval()
        with torch.inference_mode(): values.append((model(xe).cpu().numpy() * std + mean))
    values = np.vstack(values)
    return values.mean(axis=0), values.std(axis=0)
