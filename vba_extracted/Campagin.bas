Attribute VB_Name = "Campagin"
Option Explicit

Sub updateCampaignName()
    Select Case Range("SettingTxt").Value
        Case "Living Greyhawk"
            Range("CampaignName").Value = "Living Greyhawk"
        Case Else
            Range("CampaignName").Value = ""
    End Select
End Sub

Sub CampaignChange()
    Dim doapp As Boolean
    Dim CampaignIdx As Long
    Dim CC_Range As Range
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    CampaignIdx = Range("CampaignCell").Value
    
    Set CC_Range = Application.Union(Range("HRHalfPlus1"), Range("HR2Thirds"), Range("HR3Quarters"), _
                                     Range("HRGestalt"), Range("HRfBAB"), Range("HRfSave"))
    CC_Range.Value = False
    
    With wsOptions
'      .Shapes("Check Box 151").Visible = False
      .Shapes("Check Box 152").Visible = False
      .Shapes("Check Box 153").Visible = False
      .Shapes("Check Box 154").Visible = False
      .Shapes("Check Box 155").Visible = False
      .Shapes("Check Box 180").Visible = False
    End With
    
    Set CC_Range = Application.Union(Range("UseLGDeities"), Range("UseFRDeities"), Range("UseEberronDeities"), _
                                     Range("UseRavenloftBeliefs"), Range("UseDragonlanceDeities"))
    CC_Range.Value = False
    
    
    Range("HRCampaigns").Value = False
        
    Range("RegionTxt").Value = vbNullString
    
    Range("MILSheet").Value = False
    
    Set CC_Range = Nothing
    
    Select Case Range("SettingTxt").Value
      
      Case "Living Greyhawk"
        Range("HRLivingGreyhawk").Value = True
        Range("HRHalfPlus1").Value = True
        Range("MILSheet").Value = True
        wsCS1.Shapes("LogoBlank").ZOrder msoBringToFront
        wsCS1.Shapes("LGPicture").ZOrder msoBringToFront
      
      Case "Forgotten Realms"
        With wsOptions
          .Shapes("Check Box 152").Visible = True
          .Shapes("Check Box 154").Visible = True
          .Shapes("Check Box 155").Visible = True
          .Shapes("Check Box 180").Visible = True
        End With
        Range("HRFRCS").Value = True
        Range("HRPGtF").Value = True
        wsCS1.Shapes("LogoBlank").ZOrder msoBringToFront
        wsCS1.Shapes("FRCSPicture").ZOrder msoBringToFront
      
      Case "Eberron"
        With wsOptions
          .Shapes("Check Box 152").Visible = True
          .Shapes("Check Box 153").Visible = True
          .Shapes("Check Box 155").Visible = True
          .Shapes("Check Box 180").Visible = True
        End With
        Range("HREBCS").Value = True
        Range("HRECS").Value = True
        Range("HRRE").Value = True
        wsCS1.Shapes("LogoBlank").ZOrder msoBringToFront
        wsCS1.Shapes("EBCSPicture").ZOrder msoBringToFront
      
      Case "Ravenloft"
        With wsOptions
          .Shapes("Check Box 152").Visible = True
          .Shapes("Check Box 153").Visible = True
          .Shapes("Check Box 154").Visible = True
          .Shapes("Check Box 180").Visible = True
        End With
        Range("HRRLCS").Value = True
        Range("HRRVL").Value = True
        wsCS1.Shapes("LogoBlank").ZOrder msoBringToFront
        wsCS1.Shapes("RLCSPicture").ZOrder msoBringToFront
      
      Case "Dragonlance"
        With wsOptions
          .Shapes("Check Box 152").Visible = True
          .Shapes("Check Box 153").Visible = True
          .Shapes("Check Box 154").Visible = True
          .Shapes("Check Box 180").Visible = True
        End With
        Range("UseDragonlanceDeities").Value = True
        Range("HRDLCS").Value = True
        wsCS1.Shapes("LogoBlank").ZOrder msoBringToFront
        wsCS1.Shapes("DLCSPicture").ZOrder msoBringToFront
        
      Case "Rokugan"
        With wsOptions
          .Shapes("Check Box 152").Visible = True
          .Shapes("Check Box 153").Visible = True
          .Shapes("Check Box 154").Visible = True
          .Shapes("Check Box 180").Visible = True
        End With
        Range("HROA").Value = True
        wsCS1.Shapes("LogoBlank").ZOrder msoBringToFront
        wsCS1.Shapes("L5RPicture").ZOrder msoBringToFront
      
      Case Else
        With wsOptions
          .Shapes("Check Box 152").Visible = True
          .Shapes("Check Box 153").Visible = True
          .Shapes("Check Box 154").Visible = True
          .Shapes("Check Box 155").Visible = True
          .Shapes("Check Box 180").Visible = True
        End With
        wsCS1.Shapes("LogoBlank").ZOrder msoBringToFront
        wsCS1.Shapes("DandDPicture").ZOrder msoBringToFront
    
    End Select
            
    updateCampaignName
    
    Sheets("Options").Select
   
    If doapp Then
        Range("A1").Select
        appDefault
    End If
    
    
    ShowGameLog
    'UseGameLogXP
If Range("GameLogXP").Value = True Then
    If CampaignIdx = 2 Then
        Range("ExperiencePoints") = "=ARFinalXP"
    Else
        Range("ExperiencePoints") = "=GameLogXPTotal"
    End If
End If
    'UseGameLogTreasure
If Range("GameLogTreasure").Value = True Then
    If CampaignIdx = 2 Then
        Range("PP") = ""
        Range("GP") = "=ARFinalGP"
        Range("SP") = ""
        Range("CP") = ""
        Range("Art") = ""
        Range("Gems") = ""
        Range("OtherGP") = ""
    Else
        Range("PP") = "=GameLogPP"
        Range("GP") = "=GameLogGP"
        Range("SP") = "=GameLogSP"
        Range("CP") = "=GameLogCP"
        Range("Art") = "=GameLogArt"
        Range("Gems") = "=GameLogGems"
        Range("OtherGP") = "=GameLogOtherGP"
    End If
End If
    ShowMILSheet

End Sub
