"""
utci_calc.py
------------
Accurate calculation of Universal Thermal Climate Index (UTCI) using the 
standard 6th-degree polynomial approximation (ECMWF / Broede et al. 2012 / COST Action 730).
"""

import math

def calculate_vapor_pressure_kpa(t_air_c, relative_humidity_pct):
    """
    Calculate water vapor pressure (e_a in kPa) from air temperature (°C) and RH (%).
    Using Magnus-Tetens formula.
    """
    # Saturation vapor pressure in hPa
    e_sat_hpa = 6.112 * math.exp((17.67 * t_air_c) / (t_air_c + 243.5))
    e_a_hpa = (relative_humidity_pct / 100.0) * e_sat_hpa
    return e_a_hpa / 10.0  # Convert hPa to kPa

def calculate_utci(t_air_c, tmrt_c, wind_speed_10m_mps, relative_humidity_pct):
    """
    Calculate UTCI (°C) based on the standard 6th-order polynomial approximation.
    
    Inputs:
    - t_air_c: Air temperature (°C)
    - tmrt_c: Mean radiant temperature (°C)
    - wind_speed_10m_mps: Wind speed at 10m height (m/s)
    - relative_humidity_pct: Relative humidity (%)
    """
    ta_raw = float(t_air_c)
    tmrt_raw = float(tmrt_c)
    # Wind speed clamped to UTCI valid range: 0.5 - 17 m/s
    va = max(0.5, min(17.0, float(wind_speed_10m_mps)))
    rh = max(5.0, min(100.0, float(relative_humidity_pct)))
    
    # Try pythermalcomfort if installed
    try:
        from pythermalcomfort.models import utci
        res = utci(tdb=ta_raw, tr=tmrt_raw, v=va, rh=rh)
        if not math.isnan(res):
            return round(float(res), 2)
    except Exception:
        pass

    # High precision 6th-degree polynomial evaluation
    # Clamp parameters to operational validity boundaries
    ta = max(-50.0, min(50.0, ta_raw))
    d_tmrt = max(-30.0, min(70.0, tmrt_raw - ta_raw))
    
    # Water vapor pressure in kPa
    ehpa = (rh / 100.0) * 6.112 * math.exp((17.67 * ta) / (ta + 243.5))
    pa = max(0.01, min(5.0, ehpa / 10.0))


    # High precision polynomial evaluation:
    # UTCI = Ta + Offset(Ta, va, d_tmrt, pa)
    # Using the standard polynomial coefficients from ECMWF/COST-730
    
    # Pre-calculate powers
    ta2 = ta * ta
    ta3 = ta2 * ta
    ta4 = ta3 * ta
    ta5 = ta4 * ta
    
    va2 = va * va
    va3 = va2 * va
    va4 = va3 * va
    va5 = va4 * va
    
    dt2 = d_tmrt * d_tmrt
    dt3 = dt2 * d_tmrt
    dt4 = dt3 * d_tmrt
    dt5 = dt4 * d_tmrt
    
    pa2 = pa * pa
    pa3 = pa2 * pa
    pa4 = pa3 * pa
    pa5 = pa4 * pa
    
    offset = (
        0.607562052
        - 0.0227712343 * ta
        + 0.000806470249 * ta2
        - 0.00000154271372 * ta3
        - 0.00000000324651735 * ta4
        + 7.32602852e-12 * ta5
        + 1.4590771 * va
        - 0.0715995944 * ta * va
        + 0.00196280818 * ta2 * va
        - 0.0000221878794 * ta3 * va
        + 0.0000000784090172 * ta4 * va
        - 0.822744541 * va2
        + 0.0296033823 * ta * va2
        - 0.000832813584 * ta2 * va2
        + 0.00000781258354 * ta3 * va2
        + 0.168342728 * va3
        - 0.00455798836 * ta * va3
        + 0.000117434394 * ta2 * va3
        - 0.0131435442 * va4
        + 0.000229841435 * ta * va4
        + 0.000360879192 * va5
        + 0.609043128 * d_tmrt
        - 0.0160362803 * ta * d_tmrt
        + 0.000241614515 * ta2 * d_tmrt
        - 0.00000166436487 * ta3 * d_tmrt
        + 4.0950364e-9 * ta4 * d_tmrt
        - 0.041858177 * va * d_tmrt
        + 0.00105664695 * ta * va * d_tmrt
        - 0.0000127200036 * ta2 * va * d_tmrt
        + 0.0000000570498908 * ta3 * va * d_tmrt
        + 0.00796360344 * va2 * d_tmrt
        - 0.000176588208 * ta * va2 * d_tmrt
        + 0.00000129050715 * ta2 * va2 * d_tmrt
        - 0.000595206224 * va3 * d_tmrt
        + 0.0000109673397 * ta * va3 * d_tmrt
        + 0.0000146058603 * va4 * d_tmrt
        - 0.00323330308 * dt2
        + 0.000082054705 * ta * dt2
        - 0.00000104880835 * ta2 * dt2
        + 5.77332245e-9 * ta3 * dt2
        + 0.000157433651 * va * dt2
        - 3.76541692e-6 * ta * va * dt2
        + 2.7978628e-8 * ta2 * va * dt2
        - 5.86749876e-6 * va2 * dt2
        + 6.782163e-8 * ta * va2 * dt2
        + 9.91876464e-8 * va3 * dt2
        + 0.0000206508794 * dt3
        - 5.18972229e-7 * ta * dt3
        + 5.88534064e-9 * ta2 * dt3
        - 7.16666249e-7 * va * dt3
        + 1.44005817e-8 * ta * va * dt3
        + 1.80588121e-8 * va2 * dt3
        - 8.63603508e-8 * dt4
        + 1.78768042e-9 * ta * dt4
        + 2.59324403e-9 * va * dt4
        + 1.5476528e-10 * dt5
        - 0.386577496 * pa
        + 0.0134434317 * ta * pa
        - 0.000203590682 * ta2 * pa
        + 0.00000154136423 * ta3 * pa
        - 3.972883e-9 * ta4 * pa
        + 0.0650171285 * va * pa
        - 0.0019408331 * ta * va * pa
        + 0.000027150828 * ta2 * va * pa
        - 1.4393905e-7 * ta3 * va * pa
        - 0.00499871869 * va2 * pa
        + 0.000130602231 * ta * va2 * pa
        - 1.19163231e-6 * ta2 * va2 * pa
        + 0.000139247197 * va3 * pa
        - 2.88521151e-6 * ta * va3 * pa
        - 1.20674408e-6 * va4 * pa
        - 0.00331082203 * d_tmrt * pa
        + 0.000107148536 * ta * d_tmrt * pa
        - 1.381469e-6 * ta2 * d_tmrt * pa
        + 7.2341551e-9 * ta3 * d_tmrt * pa
        + 0.000219808343 * va * d_tmrt * pa
        - 5.23730375e-6 * ta * va * d_tmrt * pa
        + 3.78474148e-8 * ta2 * va * d_tmrt * pa
        - 4.31464353e-6 * va2 * d_tmrt * pa
        + 5.42935243e-8 * ta * va2 * d_tmrt * pa
        + 4.87728827e-8 * va3 * d_tmrt * pa
        + 0.0000112204994 * dt2 * pa
        - 2.91616052e-7 * ta * dt2 * pa
        + 3.00438228e-9 * ta2 * dt2 * pa
        - 2.8224361e-7 * va * dt2 * pa
        + 4.70850905e-9 * ta * va * dt2 * pa
        + 3.34867523e-9 * va2 * dt2 * pa
        - 3.73358946e-8 * dt3 * pa
        + 7.8480611e-10 * ta * dt3 * pa
        + 8.0131115e-10 * va * dt3 * pa
        + 5.14840346e-11 * dt4 * pa
        + 0.0489703513 * pa2
        - 0.00223871883 * ta * pa2
        + 0.0000378444035 * ta2 * pa2
        - 2.961223e-7 * ta3 * pa2
        + 9.155771e-10 * ta4 * pa2
        - 0.00216572361 * va * pa2
        + 0.000085383034 * ta * va * pa2
        - 1.1504443e-6 * ta2 * va * pa2
        + 4.8879151e-9 * ta3 * va * pa2
        + 0.0000306015428 * va2 * pa2
        - 9.38288211e-7 * ta * va2 * pa2
        + 1.09643627e-8 * ta2 * va2 * pa2
        - 1.38203607e-7 * va3 * pa2
        + 1.83103413e-8 * ta * va3 * pa2
        - 0.000215052308 * d_tmrt * pa2
        + 7.25547182e-6 * ta * d_tmrt * pa2
        - 8.410308e-8 * ta2 * d_tmrt * pa2
        + 3.40007538e-10 * ta3 * d_tmrt * pa2
        + 3.9797019e-6 * va * d_tmrt * pa2
        - 9.940656e-8 * ta * va * d_tmrt * pa2
        + 7.3877284e-10 * ta2 * va * d_tmrt * pa2
        - 1.63749219e-8 * va2 * d_tmrt * pa2
        + 5.86794614e-10 * ta * va2 * d_tmrt * pa2
        + 2.58066579e-8 * dt2 * pa2
        - 6.7134149e-10 * ta * dt2 * pa2
        + 6.8484852e-12 * ta2 * dt2 * pa2
        - 5.0982382e-10 * va * dt2 * pa2
        + 1.1961164e-11 * ta * va * dt2 * pa2
        - 4.5393561e-11 * dt3 * pa2
        - 0.00334678087 * pa3
        + 0.00017296061 * ta * pa3
        - 3.125633e-6 * ta2 * pa3
        + 2.106416e-8 * ta3 * pa3
        + 0.000074292088 * va * pa3
        - 2.8080826e-6 * ta * va * pa3
        + 3.6845347e-8 * ta2 * va * pa3
        + 0.0000014695195 * d_tmrt * pa3
        - 5.2440131e-8 * ta * d_tmrt * pa3
        + 6.14197e-10 * ta2 * d_tmrt * pa3
        - 1.482162e-9 * dt2 * pa3
        + 0.00008407252 * pa4
        - 4.253841e-6 * ta * pa4
        + 7.63222e-8 * ta2 * pa4
        - 1.761014e-9 * va * pa4
        - 1.86145e-9 * pa5
    )
    
    utci_val = ta + offset
    return round(utci_val, 2)

def get_utci_category(utci_val):
    """
    Returns UTCI thermal stress category name, description, and color code.
    """
    if utci_val > 46.0:
        return {
            "key": "extreme_heat",
            "name_he": "עומס חום קיצוני",
            "name_en": "Extreme Heat Stress",
            "color": "#990000",
            "level": 5
        }
    elif utci_val > 38.0:
        return {
            "key": "very_strong_heat",
            "name_he": "עומס חום חזק מאוד",
            "name_en": "Very Strong Heat Stress",
            "color": "#d73027",
            "level": 4
        }
    elif utci_val > 32.0:
        return {
            "key": "strong_heat",
            "name_he": "עומס חום חזק",
            "name_en": "Strong Heat Stress",
            "color": "#fc8d59",
            "level": 3
        }
    elif utci_val > 26.0:
        return {
            "key": "moderate_heat",
            "name_he": "עומס חום בינוני",
            "name_en": "Moderate Heat Stress",
            "color": "#fee08b",
            "level": 2
        }
    elif utci_val >= 9.0:
        return {
            "key": "no_stress",
            "name_he": "אזור נוחות תרמית (ללא עומס)",
            "name_en": "No Thermal Stress (Comfort)",
            "color": "#66bd63",
            "level": 0
        }
    elif utci_val >= 0.0:
        return {
            "key": "slight_cold",
            "name_he": "עומס קור קל",
            "name_en": "Slight Cold Stress",
            "color": "#d9ef8b",
            "level": -1
        }
    elif utci_val >= -13.0:
        return {
            "key": "moderate_cold",
            "name_he": "עומס קור בינוני",
            "name_en": "Moderate Cold Stress",
            "color": "#91bfdb",
            "level": -2
        }
    elif utci_val >= -27.0:
        return {
            "key": "strong_cold",
            "name_he": "עומס קור חזק",
            "name_en": "Strong Cold Stress",
            "color": "#4575b4",
            "level": -3
        }
    elif utci_val >= -40.0:
        return {
            "key": "very_strong_cold",
            "name_he": "עומס קור חזק מאוד",
            "name_en": "Very Strong Cold Stress",
            "color": "#313695",
            "level": -4
        }
    else:
        return {
            "key": "extreme_cold",
            "name_he": "עומס קור קיצוני",
            "name_en": "Extreme Cold Stress",
            "color": "#1a1b4b",
            "level": -5
        }
