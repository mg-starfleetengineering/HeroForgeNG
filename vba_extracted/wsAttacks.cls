Attribute VB_Name = "wsAttacks"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Private Sub Worksheet_Calculate()
    Dim doapp As Boolean
    Dim i As Integer
    If Range("AttacksChanged").Value Then
        
        doapp = (Application.Cursor <> xlWait)
        If doapp Then
            appWait
        End If
        
        For i = 1 To 6
            If Range("AttackName" & i).Value = "" Then
                wsExportSheet.Range("AttackWpn" & i).Value = 1
            End If
        Next
        
        'Update TblAttacksMirror to prevent bogus updates
        Range("TblAttacksMirror").Value = Range("TblAttacks").Value
        
        If doapp Then
            appDefault
        End If
    End If
End Sub





