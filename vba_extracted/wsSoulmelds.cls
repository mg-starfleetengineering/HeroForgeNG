Attribute VB_Name = "wsSoulmelds"
Attribute VB_Base = "0{00020820-0000-0000-C000-000000000046}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = True
Private Sub Worksheet_Change(ByVal Target As Range)
    Dim r1 As Range, r2 As Range
    Set r1 = Range("BonusEssentia")
    Set r2 = Sheets("Incarnum Abilities").Range("BonusEssentiaMirror")
    If Intersect(Target, r1) Is Nothing Then Exit Sub
    Application.EnableEvents = False
        r2.Value = r1.Value
    Application.EnableEvents = True
End Sub
