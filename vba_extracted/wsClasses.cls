Attribute VB_Name = "wsClasses"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True

Private Sub Worksheet_Change(ByVal Target As Range)
    ' Class_DropDown_Change will terminate early if no rebuild is needed
    ' or if we are in the process of Importing.
  If Not Intersect(Target, Range("TblClassLvls", "TblGestaltClassLvls")) Is Nothing Then
      Class_DropDown_Change
  End If
End Sub

