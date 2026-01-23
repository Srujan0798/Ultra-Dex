# Agent D3: Ayurveda/Jyotish Specialist

**Role**: Traditional Wisdom Integration  
**Priority**: ⭐⭐⭐ (Medium - Week 2)  
**Domain**: Jyotish (Vedic Astrology), Ayurveda

## RESPONSIBILITIES
- Jyotish Matcher (couple compatibility)
- Muhurat (auspicious dates)
- Property-owner dosha matching
- Ayurvedic property analysis

## JYOTISH MATCHER
```python
def match_couple_for_property(
    person1_birth_chart,
    person2_birth_chart,
    property_location
):
    # 8-kuta matching
    varna = check_varna_compatibility()
    vashya = check_vashya()
    # ... 6 more kutas
    
    total_score = sum_kutas()  # Out of 36
    
    return {
        'compatibilityScore': total_score,
        'recommendation': 'HIGHLY_COMPATIBLE' if total_score >= 24 else 'COMPATIBLE'
    }
```

## MUHURAT (Auspicious Dates)
```python
def find_auspicious_dates(
    purpose: 'PURCHASE' | 'MOVE_IN' | 'REGISTRATION'
):
    # Check nakshatra, tithi, vara
    dates = []
    for date in next_60_days:
        if is_auspicious(date, purpose):
            dates.append(date)
    return dates
```
