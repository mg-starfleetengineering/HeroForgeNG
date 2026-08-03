Attribute VB_Name = "Toggles"
Option Explicit

Sub ShowSkillTricks()
  With Sheets("Skill Tricks")
    .Visible = Not .Visible
  End With
End Sub

Sub ToggleGrafts()
  With Sheets("Grafts")
    .Visible = Not .Visible
  End With
End Sub

Sub ToggleMagicEquipment()
    With wsMagicEquipment
        If .Visible = xlSheetVisible Then
            .Visible = xlSheetHidden
        Else
            .Visible = xlSheetVisible
        End If
    End With
End Sub

Sub ToggleVariants()
  With Sheets("Variants")
    .Visible = Not .Visible
  End With
End Sub

Sub ShowTraits()
  Sheets("Traits").Visible = Range("HRTraits").Value
End Sub

Sub ShowFlaws()
  Sheets("Flaws").Visible = Range("HRFlaws").Value
End Sub

Sub ShowCharSheetIV()
  Sheets("Character Sheet IV").Visible = Range("CharSheetIV").Value
End Sub

Sub ShowCharSheetV()
  Sheets("Character Sheet V").Visible = Range("CharSheetV").Value
End Sub

Sub ShowtableTent()
  Sheets("Table Tent").Visible = Range("TableTent").Value
End Sub

Sub ShowGameLog()
If Range("GameLog").Value = True Then
  If Range("CampaignCell").Value = 2 Then
    Sheets("LG Game Log").Visible = True
    Sheets("Game Log").Visible = False
  Else
    Sheets("LG Game Log").Visible = False
    Sheets("Game Log").Visible = True
  End If
Else
  If Range("GameLog").Value = False Then
    If Range("CampaignCell").Value = 2 Then
      Sheets("LG Game Log").Visible = False
      Sheets("Game Log").Visible = False
    Else
      Sheets("LG Game Log").Visible = False
      Sheets("Game Log").Visible = False
    End If
  End If
End If
End Sub

Sub ShowMILSheet()
  wsLGMIL.Visible = Range("MILSheet").Value
End Sub

Sub InitiativeCard()
  Sheets("Initiative Card").Visible = Range("InitSheet").Value
End Sub

Sub HideBuffs()
    Sheets("Buffs").Select
    ActiveWindow.SelectedSheets.Visible = False
    Sheets("Enhancements").Select
End Sub

Sub ShowBuffs()
    Sheets("Buffs").Visible = True
    Sheets("Enhancements").Select
End Sub

Sub ToggleBuffs()
  With Sheets("Buffs")
    .Visible = Not .Visible
  End With
End Sub

Sub ShowItemAccessSheet()
  Sheets("LG Item Access Tracking").Visible = Range("ItemAccessSheet").Value
End Sub

Sub ToggleRace(Optional bShow As Boolean)
    
    If IsMissing(bShow) Then
        bShow = False
    End If
    
    If Not bShow Then
        bShow = Not Sheets("Custom Race").Visible
    End If
    
    If Not bShow Then
        Sheets("Options").Activate
        Sheets("Custom Race").Visible = False
        Sheets("Custom Template").Visible = False
        Range("B1").Select
    Else
        Sheets("Custom Race").Visible = True
        Sheets("Custom Template").Visible = True
        Range("B1").Select
        Sheets("Options").Activate
    End If
End Sub

Sub ToggleClass(Optional bShow As Boolean)
    If IsMissing(bShow) Then
        bShow = False
    End If
    
    If Not bShow Then
        bShow = Not Sheets("Custom Class").Visible
    End If
    
    If Not bShow Then
        Sheets("Options").Activate
        Sheets("Custom Class").Visible = False
        Range("B1").Select
    Else
        Sheets("Custom Class").Visible = True
        Range("B1").Select
        Sheets("Options").Activate
    End If
End Sub

Sub ToggleCustomFamiliar(Optional bShow As Boolean)
    
    If IsMissing(bShow) Then
        bShow = False
    End If
    
    If Not bShow Then
        bShow = Not Sheets("Custom Familiar").Visible
    End If
    
    If Not bShow Then
        Sheets("Options").Activate
        Sheets("Custom Familiar").Visible = False
        Range("B1").Select
    Else
        Sheets("Custom Familiar").Visible = True
        Range("B1").Select
        Sheets("Options").Activate
    End If
End Sub

Sub VariantSorShowDomainSelect()
  Sheets("Domain Select").Visible = Range("CCSorDomainAccess").Value
End Sub

Sub VariantWizShowDomainSelect()
  Sheets("Domain Select").Visible = Range("CCWizDomainGrantedPower").Value
End Sub
