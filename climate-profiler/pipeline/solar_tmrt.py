"""
solar_tmrt.py
-------------
Solar geometry and Mean Radiant Temperature (T_mrt) calculations according to 
standard bioclimatological models (ISO 7726 / VDI 3787).
"""

import math

def calculate_solar_position(lat_deg, lon_deg, day_of_year, hour_utc):
    """
    Calculate solar elevation angle (degrees) and zenith angle (degrees).
    """
    gamma = 2 * math.pi / 365.0 * (day_of_year - 1 + (hour_utc - 12) / 24.0)
    
    eqtime = 229.18 * (0.000075 + 0.001868 * math.cos(gamma) - 0.032077 * math.sin(gamma) \
             - 0.014615 * math.cos(2 * gamma) - 0.040849 * math.sin(2 * gamma))
    
    decl = 0.006918 - 0.399912 * math.cos(gamma) + 0.070257 * math.sin(gamma) \
           - 0.006758 * math.cos(2 * gamma) + 0.000907 * math.sin(2 * gamma) \
           - 0.002697 * math.cos(3 * gamma) + 0.00148 * math.sin(3 * gamma)
    
    time_offset = eqtime + 4 * lon_deg
    tst = hour_utc * 60 + time_offset
    
    ha_deg = (tst / 4.0) - 180
    if ha_deg < -180:
        ha_deg += 360
    elif ha_deg > 180:
        ha_deg -= 360
        
    ha_rad = math.radians(ha_deg)
    lat_rad = math.radians(lat_deg)
    
    cos_zenith = math.sin(lat_rad) * math.sin(decl) + math.cos(lat_rad) * math.cos(decl) * math.cos(ha_rad)
    cos_zenith = max(-1.0, min(1.0, cos_zenith))
    zenith_rad = math.acos(cos_zenith)
    elevation_rad = (math.pi / 2) - zenith_rad
    
    elevation_deg = math.degrees(elevation_rad)
    zenith_deg = math.degrees(zenith_rad)
    
    return elevation_deg, zenith_deg

def calculate_tmrt(t_air_c, relative_humidity, solar_radiation_direct, solar_radiation_diffuse, cloud_cover_pct, solar_elevation_deg):
    """
    Calculate Mean Radiant Temperature (T_mrt in °C) from environmental variables.
    """
    stefan_boltzmann = 5.670374e-8  # W/(m^2 K^4)
    emissivity_human = 0.97
    absorption_shortwave = 0.70     # Human body absorption
    
    t_air_k = t_air_c + 273.15
    
    # Vapor pressure (hPa)
    vp_hpa = (relative_humidity / 100.0) * 6.112 * math.exp((17.67 * t_air_c) / (t_air_c + 243.5))
    
    # Atmospheric emissivity (Brunt / Idso formula adjusted for cloud cover)
    eps_clear = 0.605 + 0.048 * math.sqrt(vp_hpa)
    n = max(0.0, min(1.0, cloud_cover_pct / 100.0))
    eps_sky = eps_clear * (1 + 0.22 * (n ** 2))
    eps_sky = min(1.0, max(eps_clear, eps_sky))
    
    # Longwave radiation from sky and ground
    l_sky = eps_sky * stefan_boltzmann * (t_air_k ** 4)
    ground_t_offset = 2.5 if solar_elevation_deg > 10 else 0.0
    t_ground_k = t_air_k + ground_t_offset
    l_ground = stefan_boltzmann * (t_ground_k ** 4)
    
    # Projected area factor for standing human
    if solar_elevation_deg > 0:
        elev_rad = math.radians(solar_elevation_deg)
        f_p = 0.308 * math.cos(elev_rad * (0.998 - (elev_rad ** 2) / 8.16))
        f_p = max(0.05, min(0.35, f_p))
    else:
        f_p = 0.0
        
    # Shortwave radiation flux
    if solar_elevation_deg > 0:
        i_direct = max(0.0, solar_radiation_direct)
        i_diffuse = max(0.0, solar_radiation_diffuse)
        i_ground_refl = (i_direct * math.sin(math.radians(solar_elevation_deg)) + i_diffuse) * 0.20
        s_body = (f_p * i_direct) + (0.5 * i_diffuse) + (0.5 * i_ground_refl)
    else:
        s_body = 0.0
        
    flux_total = (absorption_shortwave * s_body / emissivity_human) + (0.5 * l_sky + 0.5 * l_ground)
    tmrt_k = (flux_total / stefan_boltzmann) ** 0.25
    tmrt_c = tmrt_k - 273.15
    
    # Clamp to physical range
    tmrt_c = max(t_air_c - 15.0, min(t_air_c + 35.0, tmrt_c))
    return round(tmrt_c, 2)
