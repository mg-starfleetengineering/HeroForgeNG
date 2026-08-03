Attribute VB_Name = "Feats"
Option Explicit

Sub FreeFeats()
    Application.Calculate
    BonusFeatCalculate
    Range("TblAllFeatsSelected").Value = Range("TblAllFeatsAvailable").Value
End Sub

Sub BonusFeatCalculate()
    If Range("CurrentBonusFeats").Value <> 0 Then
        Range("TblBonusFeats").Cells(Range("BonusFeatCell").Value, 1).Value = _
            Range("TblBonusFeats").Cells(Range("BonusFeatCell").Value, 1).Value + _
            Range("CurrentBonusFeats").Value
    End If
    Range("BonusFeatCell").Value = Range("BonusFeatsSelection").Value
End Sub

Sub BuildFeatList()
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    Range("FeatList").Value = Range("Feats").Value
    Range("FeatList").Replace _
        what:="•", Replacement:="", _
        searchorder:=xlByRows, MatchCase:=False
    Range("FeatList").Replace _
        what:=Chr(10), Replacement:=",", _
        searchorder:=xlByRows, MatchCase:=False
    
    If doapp Then
        appDefault
    End If
End Sub

Sub FeatLinkChange()
'        Cells.Find(What:=Range("FeatSource").Value, After:=ActiveCell, LookAt:=xlWhole, _
'            searchorder:=xlByRows, SearchDirection:=xlNext, MatchCase:=False).Activate
        
        Sheets("Feats").Range("D:D").Find(what:=Range("FeatSource").Value, lookat:=xlWhole, _
            searchorder:=xlByRows, SearchDirection:=xlNext, MatchCase:=False).Activate
        ActiveWindow.ScrollRow = ActiveCell.Row
        
End Sub

Sub CountChecks()
    Dim count As Integer
    Dim loopcounter As Integer, chkrow As Integer, chkcolumn As Integer
    Dim doapp As Boolean
    
    count = 0
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
      appWait
    End If
    
    For loopcounter = 1 To ActiveSheet.Shapes.count
        If ActiveSheet.Shapes(loopcounter).Type = msoFormControl Then
            If ActiveSheet.Shapes(loopcounter).FormControlType = xlCheckBox Then
                count = count + 1
                
                chkrow = ActiveSheet.Shapes(loopcounter).TopLeftCell.Row
                chkcolumn = ActiveSheet.Shapes(loopcounter).TopLeftCell.Column
                
                ' local copy of available by source since that is needed for cond. formatting
                Cells(chkrow, chkcolumn + 87).Value = Cells(chkrow, chkcolumn + 87).Value + 1

            End If
        End If
    Next loopcounter
    
    MsgBox "Check Box Count " & count, _
        vbInformation, "Feat Check Box"

    If doapp Then
      appDefault
    End If
    
End Sub

Sub FeatsCheckAdjust()
    Dim loopcounter As Integer
    Dim selCol, cellDest As String
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
      appWait
    End If
    
    Application.ReferenceStyle = xlR1C1
    
    For loopcounter = 1 To ActiveSheet.Shapes.count
        If ActiveSheet.Shapes(loopcounter).Type = msoFormControl Then
            If ActiveSheet.Shapes(loopcounter).FormControlType = xlCheckBox Then
                ActiveSheet.Shapes(loopcounter).Select
                                
                With Selection
                    If .TopLeftCell.Column = 2 Then
                        selCol = Range("FtNormalCol").Column
                        cellDest = "R" & Range(.TopLeftCell.Address).Row & "C" & selCol
                    Else
                        selCol = Range("FtBonusCol").Column
                        cellDest = "R" & Range(.TopLeftCell.Address).Row & "C" & selCol
                    End If
                        .LinkedCell = cellDest
                End With
            End If
        End If
    Next loopcounter
    
    Application.ReferenceStyle = xlA1
    
    If doapp Then
      appDefault
    End If

End Sub

Sub FeatsHideCheckbox()

    Application.ScreenUpdating = False
If Range("FeatsHideCheck").Value = True Then

If Range("FeatsHideXPHCheck").Value = 2 Then
    Range("FeatsHideXPH").EntireRow.Hidden = True
End If
If Range("FeatsHideVRA1Check").Value = 2 Then
    Range("FeatsHideVRA1").EntireRow.Hidden = True
End If
If Range("FeatsHideUDCheck").Value = 2 Then
    Range("FeatsHideUD").EntireRow.Hidden = True
End If
If Range("FeatsHideToBCheck").Value = 2 Then
    Range("FeatsHideToB").EntireRow.Hidden = True
End If
If Range("FeatsHideToMCheck").Value = 2 Then
    Range("FeatsHideToM").EntireRow.Hidden = True
End If
If Range("FeatsHideSXCheck").Value = 2 Then
    Range("FeatsHideSX").EntireRow.Hidden = True
End If
If Range("FeatsHideSWCheck").Value = 2 Then
    Range("FeatsHideSW").EntireRow.Hidden = True
End If
If Range("FeatsHideFCIICheck").Value = 2 Then
    Range("FeatsHideFCII").EntireRow.Hidden = True
End If
If Range("FeatsHideSVCheck").Value = 2 Then
    Range("FeatsHideSV").EntireRow.Hidden = True
End If
If Range("FeatsHideSSCheck").Value = 2 Then
    Range("FeatsHideSS").EntireRow.Hidden = True
End If
If Range("FeatsHideSNCheck").Value = 2 Then
    Range("FeatsHideSN").EntireRow.Hidden = True
End If
If Range("FeatsHideRWCheck").Value = 2 Then
    Range("FeatsHideRW").EntireRow.Hidden = True
End If
If Range("FeatsHideRVLCheck").Value = 2 Then
    Range("FeatsHideRVL").EntireRow.Hidden = True
End If
If Range("FeatsHideRSCheck").Value = 2 Then
    Range("FeatsHideRS").EntireRow.Hidden = True
End If
If Range("FeatsHideRFCheck").Value = 2 Then
    Range("FeatsHideRF").EntireRow.Hidden = True
End If
If Range("FeatsHideRECheck").Value = 2 Then
    Range("FeatsHideRE").EntireRow.Hidden = True
End If
If Range("FeatsHideOACheck").Value = 2 Then
    Range("FeatsHideOA").EntireRow.Hidden = True
End If
If Range("FeatsHideRDrCheck").Value = 2 Then
    Range("FeatsHideRDr").EntireRow.Hidden = True
End If
If Range("FeatsHideRDCheck").Value = 2 Then
    Range("FeatsHideRD").EntireRow.Hidden = True
End If
If Range("FeatsHidePlHCheck").Value = 2 Then
    Range("FeatsHidePlH").EntireRow.Hidden = True
End If
If Range("FeatsHidePH2Check").Value = 2 Then
    Range("FeatsHidePH2").EntireRow.Hidden = True
End If
If Range("FeatsHidePGECheck").Value = 2 Then
    Range("FeatsHidePGE").EntireRow.Hidden = True
End If
If Range("FeatsHidePFCheck").Value = 2 Then
    Range("FeatsHidePF").EntireRow.Hidden = True
End If
If Range("FeatsHidePCCheck").Value = 2 Then
    Range("FeatsHidePC").EntireRow.Hidden = True
End If
If Range("FeatsHideMoECheck").Value = 2 Then
    Range("FeatsHideMoE").EntireRow.Hidden = True
End If
If Range("FeatsHideSoSCheck").Value = 2 Then
    Range("FeatsHideSoS").EntireRow.Hidden = True
End If
If Range("FeatsHideMMCheck").Value = 2 Then
    Range("FeatsHideMM").EntireRow.Hidden = True
End If
If Range("FeatsHideMM4Check").Value = 2 Then
    Range("FeatsHideMM4").EntireRow.Hidden = True
End If
If Range("FeatsHideMHCheck").Value = 2 Then
    Range("FeatsHideMH").EntireRow.Hidden = True
End If
If Range("FeatsHideMFCheck").Value = 2 Then
    Range("FeatsHideMF").EntireRow.Hidden = True
End If
If Range("FeatsHideLoMCheck").Value = 2 Then
    Range("FeatsHideLoM").EntireRow.Hidden = True
End If
If Range("FeatsHideLMCheck").Value = 2 Then
    Range("FeatsHideLM").EntireRow.Hidden = True
End If
If Range("FeatsHideHoLCheck").Value = 2 Then
    Range("FeatsHideHoL").EntireRow.Hidden = True
End If
If Range("FeatsHideHHCheck").Value = 2 Then
    Range("FeatsHideHH").EntireRow.Hidden = True
End If
If Range("FeatsHideHBCheck").Value = 2 Then
    Range("FeatsHideHB").EntireRow.Hidden = True
End If
If Range("FeatsHideFBCheck").Value = 2 Then
    Range("FeatsHideFB").EntireRow.Hidden = True
End If
If Range("FeatsHideELHCheck").Value = 2 Then
    Range("FeatsHideELH").EntireRow.Hidden = True
End If
If Range("FeatsHideECSCheck").Value = 2 Then
    Range("FeatsHideECS").EntireRow.Hidden = True
End If
If Range("FeatsHideMoICheck").Value = 2 Then
    Range("FeatsHideMoI").EntireRow.Hidden = True
End If
If Range("FeatsHideDsCheck").Value = 2 Then
    Range("FeatsHideDs").EntireRow.Hidden = True
End If
If Range("FeatsHideDrCheck").Value = 2 Then
    Range("FeatsHideDr").EntireRow.Hidden = True
End If
If Range("FeatsHideDMGCheck").Value = 2 Then
    Range("FeatsHideDMG").EntireRow.Hidden = True
End If
If Range("FeatsHideDMagCheck").Value = 2 Then
    Range("FeatsHideDMag").EntireRow.Hidden = True
End If
If Range("FeatsHideDLCSCheck").Value = 2 Then
    Range("FeatsHideDLCS").EntireRow.Hidden = True
End If
If Range("FeatsHideCWCheck").Value = 2 Then
    Range("FeatsHideCW").EntireRow.Hidden = True
End If
If Range("FeatsHideCSCheck").Value = 2 Then
    Range("FeatsHideCS").EntireRow.Hidden = True
End If
If Range("FeatsHideCPsCheck").Value = 2 Then
    Range("FeatsHideCPs").EntireRow.Hidden = True
End If
If Range("FeatsHideCoSCheck").Value = 2 Then
    Range("FeatsHideCoS").EntireRow.Hidden = True
End If
If Range("FeatsHideCoDCheck").Value = 2 Then
    Range("FeatsHideCoD").EntireRow.Hidden = True
End If
If Range("FeatsHideCMCheck").Value = 2 Then
    Range("FeatsHideCM").EntireRow.Hidden = True
End If
If Range("FeatsHideChVCheck").Value = 2 Then
    Range("FeatsHideChV").EntireRow.Hidden = True
End If
If Range("FeatsHideChRCheck").Value = 2 Then
    Range("FeatsHideChR").EntireRow.Hidden = True
End If
If Range("FeatsHideCDCheck").Value = 2 Then
    Range("FeatsHideCD").EntireRow.Hidden = True
End If
If Range("FeatsHideCCCheck").Value = 2 Then
    Range("FeatsHideCC").EntireRow.Hidden = True
End If
If Range("FeatsHideCArCheck").Value = 2 Then
    Range("FeatsHideCAr").EntireRow.Hidden = True
End If
If Range("FeatsHideCADCheck").Value = 2 Then
    Range("FeatsHideCAD").EntireRow.Hidden = True
End If
If Range("FeatsHideBVCheck").Value = 2 Then
    Range("FeatsHideBV").EntireRow.Hidden = True
End If
If Range("FeatsHideBECheck").Value = 2 Then
    Range("FeatsHideBE").EntireRow.Hidden = True
End If
If Range("FeatsHideAoMCheck").Value = 2 Then
    Range("FeatsHideAoM").EntireRow.Hidden = True
End If
If Range("FeatsHideCiCheck").Value = 2 Then
    Range("FeatsHideCi").EntireRow.Hidden = True
End If
If Range("FeatsHideDrMCheck").Value = 2 Then
    Range("FeatsHideDrM").EntireRow.Hidden = True
End If

ElseIf Range("FeatsHideCheck").Value = False Then

    Range("FeatsHideALL").EntireRow.Hidden = False

End If
    
    Application.ScreenUpdating = True

End Sub

Sub FeatsHideEpicCheckbox()

    Application.ScreenUpdating = False
    
If Range("EpicFeatsHideCheck").Value = True Then

    Range("FeatsHideELH").EntireRow.Hidden = True
    
ElseIf Range("EpicFeatsHideCheck").Value = False Then

    Range("FeatsHideELH").EntireRow.Hidden = False

End If
    
    Application.ScreenUpdating = True

End Sub

Sub FeatsHideDMGCheckbox()

    Application.ScreenUpdating = False
    
If Range("DMGFeatsHideCheck").Value = True Then

    Range("FeatsHideDMG").EntireRow.Hidden = True
    
ElseIf Range("DMGFeatsHideCheck").Value = False Then

    Range("FeatsHideDMG").EntireRow.Hidden = False

End If
    
    Application.ScreenUpdating = True

End Sub

Sub Martial_Feat_Change()
    Dim doapp As Boolean
    
    If Range("ImportInProgress").Value Or Range("RedoInProgress").Value Then
        Exit Sub
    End If
        
Rem    If (Range("MartialFeatChanged").Value) Then
        Range("RedoInProgress").Value = True
        
       doapp = (Application.Cursor <> xlWait)
       If doapp Then
           appWait
       End If
        
        Sheets("Maneuvers & Stances").Visible = Range("MartialClass").Value
        
        If doapp Then
            appDefault
        End If
        
        Range("RedoInProgress").Value = False
Rem    End If
            
End Sub

Sub Meldshape_Feat_Change()
    Dim doapp As Boolean
    
    If Range("ImportInProgress").Value Or Range("RedoInProgress").Value Then
        Exit Sub
    End If
        
    Range("RedoInProgress").Value = True
        
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
     
    Sheets("Soulmelds").Visible = Range("HasSoulmelds").Value
    Sheets("Incarnum Abilities").Visible = Range("ShowIncarnum").Value
    If (Range("IncarnumListChanged").Value) Then
        UpdateIndexIncarnum
        Range("IncarnumResetRange").Value = ""
    End If
     
    If doapp Then
        appDefault
    End If
     
    Range("RedoInProgress").Value = False
            
End Sub
