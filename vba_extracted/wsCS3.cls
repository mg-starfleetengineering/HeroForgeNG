Attribute VB_Name = "wsCS3"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Private Sub Worksheet_Activate()

Dim doapp As Boolean

  doapp = (Application.Cursor <> xlWait)
  If doapp Then
    appWait
  End If
  
  WordWrapAbilities "CSIIAbilities", "CSIIIAbilities"
  
  If doapp Then
    appDefault
  End If
  
End Sub

