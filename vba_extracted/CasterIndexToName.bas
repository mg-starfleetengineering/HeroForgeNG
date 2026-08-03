Attribute VB_Name = "CasterIndexToName"
Option Explicit

' Dynamic Lists are created to allow the user to select from a reduced list
' instead of a large list.  Data is stored both as a text string and an
' index into the dynamic list.
' When these lists are modified, the name is considered golden and the index
' needs to be updated.  When selections from dynamic lists are made, the index
' is considered golden and the name needs to be updated.  Subroutines in this module
' are responsible for updating the name after a selection is made.

Sub CasterLevelAdjust(RowIndex As Integer)
' +1 spell caster level adjuster
' linked to "Select Bonus Spellcaster Level" and "Select Second Spellcaster Bonus Spellcaster"
' dropdowns.
    Range("TblBonusSpellcasters").Cells(RowIndex, 1).Value = _
        Range("TblSpellClass").Cells( _
        Range("TblBonusSpellcasters").Cells(RowIndex, 2).Value, 1).Value
End Sub
Sub BonusCaster1_Change()
    CasterLevelAdjust (1)
End Sub
Sub BonusCaster2_Change()
    CasterLevelAdjust (2)
End Sub
Sub BonusCaster3_Change()
    CasterLevelAdjust (3)
End Sub
Sub BonusCaster4_Change()
    CasterLevelAdjust (4)
End Sub
Sub BonusCaster5_Change()
    CasterLevelAdjust (5)
End Sub
Sub BonusCaster6_Change()
    CasterLevelAdjust (6)
End Sub
Sub BonusCaster7_Change()
    CasterLevelAdjust (7)
End Sub
Sub BonusCaster8_Change()
    CasterLevelAdjust (8)
End Sub
Sub BonusCaster9_Change()
    CasterLevelAdjust (9)
End Sub
Sub BonusCaster10_Change()
    CasterLevelAdjust (10)
End Sub
Sub BonusCaster11_Change()
    CasterLevelAdjust (11)
End Sub
Sub BonusCaster12_Change()
    CasterLevelAdjust (12)
End Sub
Sub BonusCaster13_Change()
    CasterLevelAdjust (13)
End Sub
Sub BonusCaster14_Change()
    CasterLevelAdjust (14)
End Sub
Sub BonusCaster15_Change()
    CasterLevelAdjust (15)
End Sub
Sub BonusCaster16_Change()
    CasterLevelAdjust (16)
End Sub
Sub BonusCaster17_Change()
    CasterLevelAdjust (17)
End Sub
Sub BonusCaster18_Change()
    CasterLevelAdjust (18)
End Sub
Sub BonusCaster19_Change()
    CasterLevelAdjust (19)
End Sub
Sub BonusCaster20_Change()
    CasterLevelAdjust (20)
End Sub
Sub BonusCaster21_Change()
    CasterLevelAdjust (21)
End Sub
Sub BonusCaster22_Change()
    CasterLevelAdjust (22)
End Sub
Sub BonusCaster23_Change()
    CasterLevelAdjust (23)
End Sub
Sub BonusCaster24_Change()
    CasterLevelAdjust (24)
End Sub
Sub BonusCaster25_Change()
    CasterLevelAdjust (25)
End Sub
Sub BonusCaster26_Change()
    CasterLevelAdjust (26)
End Sub
Sub BonusCaster27_Change()
    CasterLevelAdjust (27)
End Sub
Sub BonusCaster28_Change()
    CasterLevelAdjust (28)
End Sub
Sub BonusCaster29_Change()
    CasterLevelAdjust (29)
End Sub
Sub BonusCaster30_Change()
    CasterLevelAdjust (30)
End Sub
Sub BonusCaster31_Change()
    CasterLevelAdjust (31)
End Sub
Sub BonusCaster32_Change()
    CasterLevelAdjust (32)
End Sub
Sub BonusCaster33_Change()
    CasterLevelAdjust (33)
End Sub
Sub BonusCaster34_Change()
    CasterLevelAdjust (34)
End Sub
Sub BonusCaster35_Change()
    CasterLevelAdjust (35)
End Sub
Sub BonusCaster36_Change()
    CasterLevelAdjust (36)
End Sub
Sub BonusCaster37_Change()
    CasterLevelAdjust (37)
End Sub
Sub BonusCaster38_Change()
    CasterLevelAdjust (38)
End Sub
Sub BonusCaster39_Change()
    CasterLevelAdjust (39)
End Sub
Sub BonusCaster40_Change()
    CasterLevelAdjust (40)
End Sub
Sub BonusCaster41_Change()
    CasterLevelAdjust (41)
End Sub
Sub BonusCaster42_Change()
    CasterLevelAdjust (42)
End Sub
Sub BonusCaster43_Change()
    CasterLevelAdjust (43)
End Sub
Sub BonusCaster44_Change()
    CasterLevelAdjust (44)
End Sub
Sub BonusCaster45_Change()
    CasterLevelAdjust (45)
End Sub
Sub BonusCaster46_Change()
    CasterLevelAdjust (46)
End Sub
Sub BonusCaster47_Change()
    CasterLevelAdjust (47)
End Sub
Sub BonusCaster48_Change()
    CasterLevelAdjust (48)
End Sub
Sub BonusCaster49_Change()
    CasterLevelAdjust (49)
End Sub
Sub BonusCaster50_Change()
    CasterLevelAdjust (50)
End Sub
Sub ManifesterLevelAdjust(RowIndex As Integer)
' +1 spell manifester level adjuster
' linked to "Select Bonus Manifester Level"
' dropdowns.
    Range("TblBonusManifesters").Cells(RowIndex, 1).Value = _
        Range("TblManifesterClass").Cells( _
        Range("TblBonusManifesters").Cells(RowIndex, 2).Value, 1).Value
End Sub
Sub BonusManifester1_Change()
    ManifesterLevelAdjust (1)
End Sub
Sub BonusManifester2_Change()
    ManifesterLevelAdjust (2)
End Sub
Sub BonusManifester3_Change()
    ManifesterLevelAdjust (3)
End Sub
Sub BonusManifester4_Change()
    ManifesterLevelAdjust (4)
End Sub
Sub BonusManifester5_Change()
    ManifesterLevelAdjust (5)
End Sub
Sub BonusManifester6_Change()
    ManifesterLevelAdjust (6)
End Sub
Sub BonusManifester7_Change()
    ManifesterLevelAdjust (7)
End Sub
Sub BonusManifester8_Change()
    ManifesterLevelAdjust (8)
End Sub
Sub BonusManifester9_Change()
    ManifesterLevelAdjust (9)
End Sub
Sub BonusManifester10_Change()
    ManifesterLevelAdjust (10)
End Sub
Sub BonusManifester11_Change()
    ManifesterLevelAdjust (11)
End Sub
Sub BonusManifester12_Change()
    ManifesterLevelAdjust (12)
End Sub
Sub BonusManifester13_Change()
    ManifesterLevelAdjust (13)
End Sub
Sub BonusManifester14_Change()
    ManifesterLevelAdjust (14)
End Sub
Sub BonusManifester15_Change()
    ManifesterLevelAdjust (15)
End Sub
Sub BonusManifester16_Change()
    ManifesterLevelAdjust (16)
End Sub
Sub BonusManifester17_Change()
    ManifesterLevelAdjust (17)
End Sub
Sub BonusManifester18_Change()
    ManifesterLevelAdjust (18)
End Sub
Sub BonusManifester19_Change()
    ManifesterLevelAdjust (19)
End Sub
Sub BonusManifester20_Change()
    ManifesterLevelAdjust (20)
End Sub
Sub BonusManifester21_Change()
    ManifesterLevelAdjust (21)
End Sub
Sub BonusManifester22_Change()
    ManifesterLevelAdjust (22)
End Sub
Sub BonusManifester23_Change()
    ManifesterLevelAdjust (23)
End Sub
Sub BonusManifester24_Change()
    ManifesterLevelAdjust (24)
End Sub
Sub BonusManifester25_Change()
    ManifesterLevelAdjust (25)
End Sub
Sub MeldshaperLevelAdjust(RowIndex As Integer)
' +1 meldshaper level adjuster
' linked to "Select Bonus Meldshaper Level"
' dropdowns.
    Range("TblBonusMeldshapers").Cells(RowIndex, 1).Value = _
        Range("TblMeldshaperClass").Cells( _
        Range("TblBonusMeldshapers").Cells(RowIndex, 2).Value, 1).Value
End Sub
Sub BonusMeldshaper1_Change()
    MeldshaperLevelAdjust (1)
End Sub
Sub BonusMeldshaper2_Change()
    MeldshaperLevelAdjust (2)
End Sub
Sub BonusMeldshaper3_Change()
    MeldshaperLevelAdjust (3)
End Sub
Sub BonusMeldshaper4_Change()
    MeldshaperLevelAdjust (4)
End Sub
Sub BonusMeldshaper5_Change()
    MeldshaperLevelAdjust (5)
End Sub
Sub BonusMeldshaper6_Change()
    MeldshaperLevelAdjust (6)
End Sub
Sub BonusMeldshaper7_Change()
    MeldshaperLevelAdjust (7)
End Sub
Sub BonusMeldshaper8_Change()
    MeldshaperLevelAdjust (8)
End Sub
Sub BonusMeldshaper9_Change()
    MeldshaperLevelAdjust (9)
End Sub
Sub BonusMeldshaper10_Change()
    MeldshaperLevelAdjust (10)
End Sub
Sub BonusMeldshaper11_Change()
    MeldshaperLevelAdjust (11)
End Sub
Sub BonusMeldshaper12_Change()
    MeldshaperLevelAdjust (12)
End Sub
Sub BonusMeldshaper13_Change()
    MeldshaperLevelAdjust (13)
End Sub
Sub BonusMeldshaper14_Change()
    MeldshaperLevelAdjust (14)
End Sub
Sub BonusMeldshaper15_Change()
    MeldshaperLevelAdjust (15)
End Sub
Sub BonusMeldshaper16_Change()
    MeldshaperLevelAdjust (16)
End Sub
Sub BonusMeldshaper17_Change()
    MeldshaperLevelAdjust (17)
End Sub
Sub BonusMeldshaper18_Change()
    MeldshaperLevelAdjust (18)
End Sub
Sub BonusMeldshaper19_Change()
    MeldshaperLevelAdjust (19)
End Sub
Sub BonusMeldshaper20_Change()
    MeldshaperLevelAdjust (20)
End Sub
Sub BonusMeldshaper21_Change()
    MeldshaperLevelAdjust (21)
End Sub
Sub BonusMeldshaper22_Change()
    MeldshaperLevelAdjust (22)
End Sub
Sub BonusMeldshaper23_Change()
    MeldshaperLevelAdjust (23)
End Sub
Sub BonusMeldshaper24_Change()
    MeldshaperLevelAdjust (24)
End Sub
Sub BonusMeldshaper25_Change()
    MeldshaperLevelAdjust (25)
End Sub
Sub AdjustExtraSlotSpells(SlotRow As Integer)
    Dim RowIndex As Integer
        
    ' update name
    Range("TblExtraSlots").Cells(SlotRow, 1).Value = _
        Range("TblSpellClass").Cells( _
            Range("TblExtraSlots").Cells(SlotRow, 2).Value, 1).Value
    
    ' update spell level
    If Range("TblExtraSlots").Cells(SlotRow, 2).Value = 1 Then
        Range("TblExtraSlots").Cells(SlotRow, 3).Value = 0
        Exit Sub
    End If
    RowIndex = WorksheetFunction.VLookup(Range("TblExtraSlots").Cells(SlotRow, 1).Value, _
        Range("TblCasterIndex"), 2, False) + 3
    Range("TblExtraSlots").Cells(SlotRow, 3).Value = maxSpellLevel(RowIndex)
End Sub
Sub ExtraSlot1_Change()
    AdjustExtraSlotSpells (1)
End Sub
Sub ExtraSlot2_Change()
    AdjustExtraSlotSpells (2)
End Sub
Sub ExtraSlot3_Change()
    AdjustExtraSlotSpells (3)
End Sub
Sub AdjustExtraSpells(SpellRow As Integer)
    Dim RowIndex As Integer
    
    ' update name
    Range("TblExtraSpells").Cells(SpellRow, 1).Value = _
        Range("TblSpellClass").Cells( _
            Range("TblExtraSpells").Cells(SpellRow, 2).Value, 1).Value
    
    ' update spell level
    If Range("TblExtraSpells").Cells(SpellRow, 2).Value = 1 Then
        Range("TblExtraSpells").Cells(SpellRow, 3).Value = 0
        Exit Sub
    End If
    RowIndex = WorksheetFunction.VLookup(Range("TblExtraSpells").Cells(SpellRow, 1).Value, _
        Range("TblCasterIndex"), 2, _
        False) + 3
    Range("TblExtraSpells").Cells(SpellRow, 3).Value = maxSpellLevel(RowIndex)
End Sub
Sub ExtraSpell1_Change()
    AdjustExtraSpells (1)
End Sub
Sub ExtraSpell2_Change()
    AdjustExtraSpells (2)
End Sub
Sub ExtraSpell3_Change()
    AdjustExtraSpells (3)
End Sub
Sub AdjustPracticedManifesters(SlotRow As Integer)
   
    ' update name
    Range("TblPracticedManifesters").Cells(SlotRow, 1).Value = _
          Range("TblManifesterClass").Cells( _
            Range("TblPracticedManifesters").Cells(SlotRow, 2).Value, 1).Value
End Sub
Sub PracticedManifester1_Change()
    AdjustPracticedManifesters (1)
End Sub
Sub PracticedManifester2_Change()
    AdjustPracticedManifesters (2)
End Sub
Sub PracticedManifester3_Change()
    AdjustPracticedManifesters (3)
End Sub
Sub AdjustPracticedSpellcasters(SlotRow As Integer)
   
    ' update name
    Range("TblPracticedSpellcasters").Cells(SlotRow, 1).Value = _
          Range("TblSpellClass").Cells( _
            Range("TblPracticedSpellcasters").Cells(SlotRow, 2).Value, 1).Value
End Sub
Sub PracticedSpellcaster1_Change()
    AdjustPracticedSpellcasters (1)
End Sub
Sub PracticedSpellcaster2_Change()
    AdjustPracticedSpellcasters (2)
End Sub
Sub PracticedSpellcaster3_Change()
    AdjustPracticedSpellcasters (3)
End Sub
Function maxSpellLevel(RowIndex As Integer) As Integer
    Dim c As Variant
    maxSpellLevel = -1
    With Worksheets("Spell Information")
        For Each c In .Range(.Cells(RowIndex, 13), .Cells(RowIndex, 22))
            If c.Value <> "" Then
                maxSpellLevel = maxSpellLevel + 1
            Else
                Exit For
            End If
        Next c
    End With
End Function
Sub AdjustExpandedKnowledge(PowerRow As Integer)
    Dim RowIndex As Integer
    
    ' update name
    Range("TblExpandedKnowledge").Cells(PowerRow, 1).Value = _
        Range("TblManifesterClass").Cells( _
            Range("TblExpandedKnowledge").Cells(PowerRow, 2).Value, 1).Value
    
    ' update spell level
    If Range("TblExpandedKnowledge").Cells(PowerRow, 2).Value = 1 Then
        Range("TblExpandedKnowledge").Cells(PowerRow, 3).Value = 0
        Exit Sub
    End If
    RowIndex = WorksheetFunction.VLookup(Range("TblExpandedKnowledge").Cells(PowerRow, 1).Value, _
        Range("TblManifesterIndex"), 2, _
        False)
    Range("TblExpandedKnowledge").Cells(PowerRow, 3).Value = maxPowerLevel(RowIndex)
End Sub
Sub ExpandedKnowledge1_Change()
    AdjustExpandedKnowledge (1)
End Sub
Sub ExpandedKnowledge2_Change()
    AdjustExpandedKnowledge (2)
End Sub
Sub ExpandedKnowledge3_Change()
    AdjustExpandedKnowledge (3)
End Sub
Sub Tashalatora_Change()
    Dim RowIndex As Integer
    
    ' update name
    Range("TashalatoraClass").Value = _
        Range("TblManifesterClass").Cells( _
            Range("TashalatoraCell").Value, 1).Value

End Sub
Function maxPowerLevel(RowIndex As Integer) As Integer
    maxPowerLevel = Range("TblMaxPowerLvlKnown").Cells(RowIndex, 1)
End Function
Sub SublineBuddyAdjust()
    Range("SublimeBuddyClass").Value = _
        Range("TblSpellClass").Cells(Range("SublimeBuddyClassCell").Value, 1).Value
End Sub
