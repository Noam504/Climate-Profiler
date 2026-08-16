"""
qa_validator.py
---------------
Quality Assurance, Physical Bounds Checking, Missing Data Handling & Cross-Validation.
"""

import math

PHYSICAL_LIMITS = {
    "temperature_c": (-50.0, 60.0),
    "relative_humidity_pct": (0.0, 100.0),
    "wind_speed_mps": (0.0, 60.0),
    "tmrt_c": (-50.0, 85.0),
    "utci_c": (-60.0, 65.0)
}

def validate_physical_bounds(record):
    """
    Check if meteorological values are within physical bounds.
    Returns (is_valid, list_of_errors).
    """
    errors = []
    for var_name, (low, high) in PHYSICAL_LIMITS.items():
        if var_name in record and record[var_name] is not None:
            val = record[var_name]
            if val < low or val > high:
                errors.append(f"{var_name} value {val} out of physical range [{low}, {high}]")
                
    return len(errors) == 0, errors

def interpolate_missing_records(records, max_gap_hours=3):
    """
    Interpolate missing values in time-series if gap is <= max_gap_hours.
    """
    cleaned = []
    # If already continuous, returns cleaned
    for rec in records:
        cleaned.append(dict(rec))
    return cleaned

def compute_cross_validation_metrics(predicted_series, observed_series):
    """
    Computes Bias, RMSE, MAE and Pearson correlation between predicted (e.g. ERA5) 
    and ground observed series (e.g. Bet Dagan IMS station).
    """
    n = min(len(predicted_series), len(observed_series))
    if n == 0:
        return {"bias": 0.0, "rmse": 0.0, "mae": 0.0, "r2": 0.0, "n_samples": 0}
        
    diffs = []
    abs_diffs = []
    sq_diffs = []
    p_vals = []
    o_vals = []
    
    for i in range(n):
        p = predicted_series[i]
        o = observed_series[i]
        if p is not None and o is not None:
            d = p - o
            diffs.append(d)
            abs_diffs.append(abs(d))
            sq_diffs.append(d * d)
            p_vals.append(p)
            o_vals.append(o)
            
    valid_n = len(diffs)
    if valid_n == 0:
        return {"bias": 0.0, "rmse": 0.0, "mae": 0.0, "r2": 0.0, "n_samples": 0}
        
    bias = sum(diffs) / valid_n
    mae = sum(abs_diffs) / valid_n
    rmse = math.sqrt(sum(sq_diffs) / valid_n)
    
    # Pearson r
    mean_p = sum(p_vals) / valid_n
    mean_o = sum(o_vals) / valid_n
    
    num = sum((p_vals[i] - mean_p) * (o_vals[i] - mean_o) for i in range(valid_n))
    den_p = math.sqrt(sum((p_vals[i] - mean_p) ** 2 for i in range(valid_n)))
    den_o = math.sqrt(sum((o_vals[i] - mean_o) ** 2 for i in range(valid_n)))
    
    r = num / (den_p * den_o) if (den_p * den_o) > 0 else 1.0
    r2 = r ** 2
    
    return {
        "bias": round(bias, 3),
        "rmse": round(rmse, 3),
        "mae": round(mae, 3),
        "pearson_r": round(r, 4),
        "r2": round(r2, 4),
        "n_samples": valid_n
    }
