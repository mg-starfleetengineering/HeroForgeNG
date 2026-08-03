Attribute VB_Name = "CasterNameToIndex"
Option Explicit

' Dynamic Lists are created to allow the user to select from a reduced list
' instead of a large list.  Data is stored both as a text string and an
' index into the dynamic list.
' When these lists are modified, the name is considered golden and the index
' needs to be updated.  When selections from dynamic lists are made, the index
' is considered golden and the name needs to be updated.  Subroutines in this module
' are responsible for updating the index after a dynamic list changes.

Sub UpdateIndexCaster()
    Dim RowIndex As Integer
    Dim val As Integer
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    'Bonus SpellCaster
    For RowIndex = 1 To 29
        If Not IsEmpty(Range("TblBonusSpellcasters").Cells(RowIndex, 1).Value) Then
            val = WorksheetFunction.Match(Range("TblBonusSpellcasters").Cells(RowIndex, 1).Value, _
                    Range("TblSpellClass"), 0)
            Range("TblBonusSpellcasters").Cells(RowIndex, 2).Value = val
            If val = 1 Then
                Range("TblBonusSpellcasters").Cells(RowIndex, 1).Value = "Select Spell Casting Class"
            End If
        End If
    Next RowIndex
        
    'Subline Chord Buddy Class
    If Not IsEmpty(Range("SublimeBuddyClass").Value) Then
        Range("SublimeBuddyClassCell").Value = _
            WorksheetFunction.Match(Range("SublimeBuddyClass").Value, _
                Range("TblSpellClass"), 0)
    End If
    
    'Practiced Spellcaster
    For RowIndex = 1 To 3
        If Not IsEmpty(Range("TblPracticedSpellcasters").Cells(RowIndex, 1).Value) Then
            Range("TblPracticedSpellcasters").Cells(RowIndex, 2).Value = _
                WorksheetFunction.Match(Range("TblPracticedSpellcasters").Cells(RowIndex, 1).Value, _
                    Range("TblSpellClass"), 0)
        End If
    Next RowIndex
    
    'Extra Slot Bonus Spell
    For RowIndex = 1 To 3
        If Not IsEmpty(Range("TblExtraSlots").Cells(RowIndex, 1).Value) Then
            val = WorksheetFunction.Match(Range("TblExtraSlots").Cells(RowIndex, 1).Value, _
                    Range("TblSpellClass"), 0)
            Range("TblExtraSlots").Cells(RowIndex, 2).Value = val
            If val = 1 Then
                Range("TblExtraSlots").Cells(RowIndex, 1).Value = "Select Spell Casting Class"
                Range("TblExtraSlots").Cells(RowIndex, 3).Value = 0
            End If
        End If
    Next RowIndex
    
    'Extra Spell
    For RowIndex = 1 To 3
        If Not IsEmpty(Range("TblExtraSpells").Cells(RowIndex, 1).Value) Then
            val = WorksheetFunction.Match(Range("TblExtraSpells").Cells(RowIndex, 1).Value, _
                    Range("TblSpellClass"), 0)
            Range("TblExtraSpells").Cells(RowIndex, 2).Value = val
            If val = 1 Then
                Range("TblExtraSpells").Cells(RowIndex, 1).Value = "Select Spell Casting Class"
                Range("TblExtraSpells").Cells(RowIndex, 3).Value = 0
            End If
        End If
    Next RowIndex
    
    'Update TblSpellCasterMirror to prevent bogus updates
    Range("TblSpellClassMirror").Value = Range("TblSpellClass").Value
    
    If doapp Then
        appDefault
    End If
End Sub
Sub UpdateIndexManifester()
    Dim RowIndex As Integer
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    'Bonus Manifester
    For RowIndex = 1 To 15
        If Not IsEmpty(Range("TblBonusManifesters").Cells(RowIndex, 1).Value) Then
            Range("TblBonusManifesters").Cells(RowIndex, 2).Value = _
                WorksheetFunction.Match(Range("TblBonusManifesters").Cells(RowIndex, 1).Value, _
                    Range("TblManifesterClass"), 0)
        End If
    Next RowIndex
        
    'Expanded Knowledge
    For RowIndex = 1 To 3
        If Not IsEmpty(Range("TblExpandedKnowledge").Cells(RowIndex, 1).Value) Then
            Range("TblExpandedKnowledge").Cells(RowIndex, 2).Value = _
                WorksheetFunction.Match(Range("TblExpandedKnowledge").Cells(RowIndex, 1).Value, _
                    Range("TblManifesterClass"), 0)
        End If
    Next RowIndex
        
    'Update TblManifesterMirror to prevent bogus updates
    Range("TblManifesterMirror").Value = Range("TblManifesterClass").Value

    If doapp Then
        appDefault
    End If
End Sub

Sub UpdateIndexMeldshaper()
    Dim RowIndex As Integer
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    'Bonus Meldshaper
    For RowIndex = 1 To 15
        If Not IsEmpty(Range("TblBonusMeldshapers").Cells(RowIndex, 1).Value) Then
            Range("TblBonusMeldshapers").Cells(RowIndex, 2).Value = _
                WorksheetFunction.Match(Range("TblBonusMeldshapers").Cells(RowIndex, 1).Value, _
                    Range("TblMeldshaperClass"), 0)
        End If
    Next RowIndex
        
    'Update TblMeldshaperMirror to prevent bogus updates
    Range("TblMeldshaperMirror").Value = Range("TblMeldshaperClass").Value

    If doapp Then
        appDefault
    End If
End Sub

Sub UpdateIndexIncarnum()
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    'Update TblIncarnumMirror to prevent bogus updates
    Range("TblIncarnumMirror").Value = Range("TblIncarnumAbilities").Value

    If doapp Then
        appDefault
    End If
End Sub
