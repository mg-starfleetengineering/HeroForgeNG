Attribute VB_Name = "GameLogRoutines"
Option Explicit

Sub UseGameLogXP()
If Range("GameLogXP").Value = False Then
    Range("ExperiencePoints").Value = Range("ExportExperiencePoints").Value
End If
If Range("GameLogXP").Value = True Then
    If Range("CampaignCell").Value = 2 Then
        Range("ExperiencePoints") = "=ARFinalXP"
    Else
        Range("ExperiencePoints") = "=GameLogXPTotal"
    End If
End If
End Sub

Sub UseGameLogTreasure()
  If Range("GameLogTreasure").Value = True Then
      If Range("CampaignCell").Value = 2 Then
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
  
  Else
  
      Range("Coins").Value = Range("ExportCoins").Value
      Range("CoinsOther").Value = Range("ExportCoinsOther").Value
      
  End If
End Sub

