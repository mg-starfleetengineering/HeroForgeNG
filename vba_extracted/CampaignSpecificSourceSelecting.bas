Attribute VB_Name = "CampaignSpecificSourceSelecting"
Sub OM_Players_Guide_to_Faerun()
If Range("HRPGtF").Value = False Then
    Range("HRMoF").Value = False
    Range("HRRoF").Value = False
End If

End Sub
Sub OM_Magic_of_Faerun()
If Range("HRMoF").Value = True Then
    Range("HRPGtF").Value = True
End If

End Sub
Sub OM_Races_of_Faerun()
If Range("HRRoF").Value = True Then
    Range("HRPGtF").Value = True
End If

End Sub
Sub OM_Eberron_Campaign_Setting()
If Range("HRECS").Value = True Then
    'Range("HRFN").Value = False
    Range("HRRE").Value = True
    'Range("HRSN").Value = False
End If
If Range("HRECS").Value = False Then
    Range("HRFN").Value = False
    Range("HRRE").Value = False
    Range("HRSN").Value = False
End If

End Sub
Sub OM_Five_Nations()
If Range("HRFN").Value = True Then
    Range("HRECS").Value = True
    Range("HRRE").Value = True
End If

End Sub
Sub OM_Races_of_Eberron()
If Range("HRRE").Value = True Then
    Range("HRECS").Value = True
End If

End Sub
Sub OM_Sharn()
If Range("HRSN").Value = True Then
    Range("HRECS").Value = True
    Range("HRRE").Value = True
End If

End Sub
Sub OM_Explorers_Handbook()
If Range("HREH").Value = True Then
    Range("HRECS").Value = True
    Range("HRRE").Value = True
End If

End Sub
Sub OM_Players_Guide_to_Eberron()
If Range("HRPGtE").Value = True Then
    Range("HRECS").Value = True
    Range("HRRE").Value = True
End If

End Sub
Sub OM_Secrets_of_Xendrik()
If Range("HRSoX").Value = True Then
    Range("HRECS").Value = True
    Range("HRRE").Value = True
End If

End Sub
Sub OM_Magic_of_Eberron()
If Range("HRMoE").Value = True Then
    Range("HRECS").Value = True
    Range("HRRE").Value = True
End If

End Sub
Sub OM_Ravenloft_Campaign_Setting()
If Range("HRRVL").Value = False Then
    Range("HRHOL").Value = False
    Range("HRCOD").Value = False
    Range("HRVRA1").Value = False
End If

End Sub
Sub OM_Heroes_of_Light()
If Range("HRHOL").Value = True Then
    Range("HRRVL").Value = True
End If

End Sub
Sub OM_Champions_of_Darkness()
If Range("HRCOD").Value = True Then
    Range("HRRVL").Value = True
End If

End Sub
Sub OM_Van_Ritchens_Arsenal_Vol1()
If Range("HRVRA1").Value = True Then
    Range("HRRVL").Value = True
End If

End Sub

