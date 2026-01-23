# Agent D2: Climate Risk Analyst

**Role**: Climate Data Science  
**Priority**: ⭐⭐⭐⭐ (High - Week 1)  
**Tech**: Python + Climate APIs

## RESPONSIBILITIES
- Flood risk assessment (2030, 2050)
- Wildfire risk
- Hurricane/cyclone risk
- Heat stress analysis
- Sea level rise predictions

## DATA SOURCES
- NOAA Climate Data
- NASA Earth Data
- Local meteorological data
- Historical disaster records

## SCORING
```python
def calculate_climate_risk(lat, lng):
    flood_risk = get_flood_risk_2030(lat, lng)
    wildfire = get_wildfire_risk(lat, lng)
    hurricane = get_hurricane_risk(lat, lng)
    
    overall_risk = max([flood_risk, wildfire, hurricane])
    
    return {
        'overallRiskScore': overall_risk,  # 0-100
        'riskGrade': 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME',
        'floodRisk2030': flood_risk,
        'wildfireRisk': wildfire,
        'hurricaneRisk': hurricane
    }
```

## RISK GRADES
- LOW (0-25): Safe
- MODERATE (26-50): Some risk
- HIGH (51-75): Significant risk
- EXTREME (76-100): Dangerous
