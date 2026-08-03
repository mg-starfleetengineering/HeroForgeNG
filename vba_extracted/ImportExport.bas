Attribute VB_Name = "ImportExport"
Option Explicit

' module scope to support helper functions during import
Private ThatWorkbook As Workbook

Private Function WorkbookIsOpen(wbname) As Boolean
'   Returns TRUE if the workbook is open
    Dim x As Workbook
    On Error Resume Next
    Set x = Workbooks(wbname)
    WorkbookIsOpen = (Err = 0)
End Function

Sub PushToExportSheet()
'Race & Stats (Updated)
    Range("ExportBaseStats").Value = Range("BaseStats").Value
    Range("ExportRaceTxt").Value = Range("RaceTxt").Value
    Range("ExportStatBumps").Value = Range("StatBumps").Value
    Range("ExportCharacterDescription").Value = Range("CharacterDescription").Value
    Range("ExportCoins").Value = Range("Coins").Value
    Range("ExportCoinsOther").Value = Range("CoinsOther").Value
    Range("ExportCampaignName").Value = Range("CampaignName").Value
    Range("ExportGenderOverride").Value = Range("GenderOverride").Value
    Range("ExportRegionOverride").Value = Range("RegionOverride").Value
    Range("ExportEthnicityOverride").Value = Range("EthnicityOverride").Value
    Range("ExportDeityOverride").Value = Range("DeityOverride").Value
    Range("ExportFavoredWeaponOverride").Value = Range("FavoredWeaponOverride").Value
    Range("ExportCROverride").Value = Range("CROverride").Value
    Range("ExportPlayer").Value = Range("Player").Value
    Range("ExportExperiencePoints").Value = Range("ExperiencePoints").Value
    Range("ExportLABuyOff").Value = Range("LABuyOff").Value

'Templates
    Range("ExportGender").Value = Range("GenderTxt").Value
    Range("ExportRegion").Value = Range("RegionTxt").Value
    Range("ExportEthnicity").Value = Range("RaceEthnicityTxt").Value
    
    Range("ExportTemplateSelection").Value = Range("TemplateSelection").Value
    Range("ExportTemplateSelectionLvl").Value = Range("TemplateSelectionLvl").Value
        
    Range("ExportRaceSelectionOptions").Value = Range("RaceSelectionOptions").Value
    Range("ExportTemplateSelectionOptions").Value = Range("TemplateSelectionOptions").Value
    
'Classes (Updated)
    Range("ExportClassLvls").Value = Range("TblClassLvls").Value
    Range("ExportGestaltClassLvls").Value = Range("TblGestaltClassLvls").Value
    Range("ExportHitPoints").Value = Range("TblHitPoints").Value
        
'Prestige Classes I, II, FRCS (Updated)
    Range("DragonkithSpellExport").Value = Range("DragonkithSpell").Value
    Range("SAMoSSpellsExport").Value = Range("SAMoSSpells").Value
    Range("ExportCataclysmMageProphecies").Value = Range("TblCataclysmMageProphecies").Value
    Range("ExportRMmComponents").Value = Range("RenegadeMastermakerComponents").Value

'Skills (Updated)
    Range("ExportSkillList").Value = Range("TblSkillList").Value
    Range("ExportSkillMatrix").Value = Range("TblSkillMatrix").Value
        
'Skill Tricks
    Range("ExportSkillTricksSelected").Value = Range("TblSkillTricksSelected").Value
    
'Variants
    Range("ExportWasteHunter").Value = Range("WasteHunterCreature").Value
    
'Traits
    Range("ExportTraitsSelected").Value = Range("TblTraitsSelected").Value
    Range("ExportTraitsListSelected").Value = Range("TblTraitsListSelected").Value
    Range("ExportUserTraits").Value = Range("TblUserTraits").Value
    
'Flaws
    Range("ExportFlawsSelected").Value = Range("TblFlawsSelected").Value
    Range("ExportUserFlaws").Value = Range("TblUserFlaws").Value
    
'Maneuvers & Stances
    Range("ExportManeuversSelected").Value = Range("TblManeuversSelected").Value
    Range("ExportManeuversReadied").Value = Range("TblManeuversReadied").Value
    Range("ExportToBPrC").Value = Range("TblToBPrCSelected").Value
    
'Languages (Updated)
    Range("ExportLanguageList").Value = Range("TblLanguageList").Value
    Range("ExportLanguagesSelected").Value = Range("TblLanguagesSelected").Value

'Enhancements (Updated)
    Range("ExportEnhancements").Value = Range("TblEnhancements").Value
    Range("ExportEnhancementSkills").Value = Range("TblEnhancementSkills").Value
    
        
'Feats (Updated)
    Range("ExportBonusFeats").Value = Range("BonusFeats").Value
    Range("ExportFeatsSelected").Value = Range("TblFeatsSelected").Value
    Range("ExportBonusSelected").Value = Range("TblBonusSelected").Value
    Range("ExportListSelected").Value = Range("TblListSelected").Value
    Range("ExportSpellMastery").Value = Range("TblSpellMastery").Value
    Range("ExportSignatureSpell").Value = Range("TblSignatureSpell").Value
    Range("ExportFtArcaneThesis").Value = Range("TblFtArcaneThesis").Value
    Range("ExportCustomFeats").Value = Range("TblCustomFeats").Value
    Range("ExportCustomFeatsDesc").Value = Range("TblCustomFeatsDesc").Value
    Range("TblExportEfficientItemCreationFeat").Value = Range("TblEfficientItemCreationFeat").Value
    Range("TblExportPermanentEminationFeat").Value = Range("TblPermanentEminationFeat").Value
    Range("TblExportSpellStowawayFeat").Value = Range("TblSpellStowawayFeat").Value
    Range("TblExportSpontaneousSpellFeat").Value = Range("TblSpontaneousSpellFeat").Value
    Range("TblExportTenaciousMagicFeat").Value = Range("TblTenaciousMagicFeat").Value
    Range("TblExportPsicrystalPowerFeat").Value = Range("TblPsicrystalPowerFeat").Value
    Range("ExportSymbiontMastery").Value = Range("TblSymbiontMastery").Value
    
    
'Armor (Updated)
    Range("ExportArmorProps").Value = Range("ArmorProps").Value
    Range("ExportArmorOverrides").Value = Range("TblArmorOverrides").Value
    Range("ExportShieldProps").Value = Range("ShieldProps").Value
    Range("ExportShieldOverrides").Value = Range("TblShieldOverrides").Value
        
'Attacks (Updated)
    Range("ExportWeapon1Overrides").Value = Range("TblWeapon1Overrides").Value
    Range("ExportWeapon2Overrides").Value = Range("TblWeapon2Overrides").Value
    Range("ExportWeapon3Overrides").Value = Range("TblWeapon3Overrides").Value
    Range("ExportWeapon4Overrides").Value = Range("TblWeapon4Overrides").Value
    Range("ExportWeapon5Overrides").Value = Range("TblWeapon5Overrides").Value
    Range("ExportWeapon6Overrides").Value = Range("TblWeapon6Overrides").Value
        
' Binder Vestiges Sheet Selections
    Range("SvVestigeChoice1").Value = Range("VestigeChoice1").Value
    Range("SvVestigeChoice2").Value = Range("VestigeChoice2").Value
    Range("SvVestigeChoice3").Value = Range("VestigeChoice3").Value
    Range("SvVestigeChoice4").Value = Range("VestigeChoice4").Value
    
    Range("SvPactAugChoice1").Value = Range("PactAugChoice1").Value
    Range("SvPactAugChoice2").Value = Range("PactAugChoice2").Value
    Range("SvPactAugChoice3").Value = Range("PactAugChoice3").Value
    Range("SvPactAugChoice4").Value = Range("PactAugChoice4").Value
    Range("SvPactAugChoice5").Value = Range("PactAugChoice5").Value
    
        
'Character Sheet I
    Range("ExportTblConditionalModifiers").Value = Range("TblConditionalModifiers").Value

'Character Sheet II (Updated)
    'Equipment
    Range("ExportEquipment1").Value = Range("TblEquipment1").Value
    Range("ExportEquipment2").Value = Range("TblEquipment2").Value
    Range("ExportWeights1").Value = Range("TblWeights1").Value
    Range("ExportWeights2").Value = Range("TblWeights2").Value
    
    'Notes (Updated)
    Range("ExportNotes1").Value = Range("TblNotes1").Value
    Range("ExportNotes2").Value = Range("TblNotes2").Value
    
    'Additional Notes
    Range("ExportNotes3").Value = Range("TblNotes3").Value
    Range("ExportNotes4").Value = Range("TblNotes4").Value
    
    'Game Log
    Range("TblGameLogExport").Value = Range("TblGameLog").Value
    
    'LG Game Log
    Range("ExportARInfo1").Value = Range("ARInfo1").Value
    Range("ExportARInfo2").Value = Range("ARInfo2").Value
    Range("ExportARInfo3").Value = Range("ARInfo3").Value
    Range("ExportARInfo4").Value = Range("ARInfo4").Value
    
    'LG MIL Sheet
    Range("TblExportMIL").Value = Range("TblMIL").Value
    
    'LG Item Access Sheet
    Range("ExportItemAccessList").Value = Range("TblItemAccessList").Value
    
    'Buffs Sheet
    Range("ExportBuffSpellsSelect").Value = Range("BuffSpellsSelect").Value
    Range("ExportBuffSpellsCasterLevel").Value = Range("BuffSpellsCasterLevel").Value
    Range("ExportBuffClassSelect").Value = Range("BuffClassSelect").Value
    Range("ExportBuffConditionalSelect").Value = Range("BuffConditionalSelect").Value
    'Range("ExportRaceBuffsSelected").Value = Range("TblRaceBuffsSelected").Value
    Range("'ExportSheet'!AT48").Value = Range("'Buffs'!M40").Value
    Range("ExportMiscBuffsSelected").Value = Range("TblMiscBuffsSelected").Value
    Range("ExportPsionicBuffsSelected").Value = Range("TblPsionicBuffsSelected").Value
    Range("ExportAugPsionicBuffs").Value = Range("TblAugPsionicBuffs").Value
    
    'Table Tent
    Range("ExportTableTentPicture").Value = Range("TableTentPicture").Value
    
    'Familiar Sheet
    Range("ExportFamName").Value = Range("FamiliarName").Value
    
    'Animal Companion Sheet
    Range("ExportCompName").Value = Range("CompanionName").Value
    Range("ExportCompAge").Value = Range("CompanionAge").Value
    Range("ExportCompGender").Value = Range("CompanionGender").Value
    Range("ExportCompHeight").Value = Range("CompanionHeight").Value
    Range("ExportCompWeight").Value = Range("CompanionWeight").Value
    Range("ExportCompEyes").Value = Range("CompanionEyes").Value
    Range("ExportCompHair").Value = Range("CompanionHair").Value
    Range("ExportCompSkillRanks").Value = Range("CompanionSkillRanks").Value
    Range("ExportCompSkillMisc").Value = Range("CompanionSkillMisc").Value
    Range("ExportCompArmor").Value = Range("CompanionArmor").Value
    Range("ExportCompShield").Value = Range("CompanionShield").Value
    Range("ExportCompDeflect").Value = Range("CompanionDeflect").Value
    Range("ExportCompMiscAC").Value = Range("CompanionMiscAC").Value
    
    'Version Number
    Range("ExportVersion").Value = Range("Version").Value
    Range("ExportVersionBreakdown").Value = Range("VersionBreakdown").Value
    Range("VersionExport").Value = Range("Version").Value

End Sub
Sub Export()
    ' Windows or Mac?
    ' These file-type filters could use to be refined
    Dim osType As String, initialFileToSave As String
    Dim fileToSave As Variant
    Dim thisSheet As Worksheet
    Dim doapp As Boolean
    Dim fileExists As Integer
    
    fileExists = vbCancel
        
    osType = Application.OperatingSystem
    initialFileToSave = Range("CharacterName").Value & " (Lvl " & _
        Range("CharLvl").Value & ")_" & Range("Version").Value & "(D&D 3.5).hfg"
    
    Do
        If osType Like "*Windows*" Then
            fileToSave = Application.GetSaveAsFilename( _
                InitialFilename:=initialFileToSave, _
                fileFilter:="HeroForge Files (*.hfg), *.hfg")
        Else
             fileToSave = Application.GetSaveAsFilename( _
                 InitialFilename:=initialFileToSave)
        End If

        'If they cancelled, don't do anything
        If osType Like "*Windows*" Then
            If fileToSave <> False Then
                Dim fs As Object
                Set fs = CreateObject("Scripting.FileSystemObject")

                If fs.fileExists(fileToSave) Then
                    fileExists = MsgBox("Warning: " & Chr(13) & _
                        "File exists, overwrite? ", _
                        vbYesNoCancel, "HeroForge Export")
                    If fileExists = vbYes Then
                        fs.DeleteFile (fileToSave)
                    End If
                Else
                    fileExists = vbYes
                End If
            End If
        Else
            fileExists = vbYes
        End If
    Loop Until fileExists <> vbNo
        
    If fileExists = vbCancel Then
        Exit Sub
    End If

    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    Set thisSheet = ActiveSheet

    PushToExportSheet
    
    Dim sheetsInWorkbook As Integer
    Dim exportVisible As Boolean

    
    sheetsInWorkbook = Application.SheetsInNewWorkbook
    Application.SheetsInNewWorkbook = 1
    
    exportVisible = Sheets("ExportSheet").Visible
    Sheets("ExportSheet").Visible = True
    Sheets("ExportSheet").Select
    Cells.Select
    Selection.Copy
    Workbooks.Add
    ActiveSheet.Paste
    ActiveSheet.Name = "ExportSheet"
    ActiveWindow.Zoom = 75
    
    ''''''''''''''''''''''''''''
    ' Save Custom Race - BEGIN '
    
    If ThisWorkbook.Worksheets("Custom Race").Range("HasCustomRace") Then
        ThisWorkbook.Worksheets("Custom Race").Copy After:=ActiveSheet
        ActiveWorkbook.Worksheets(1).Activate
    End If
    
    ' Save Custom Race - END   '
    ''''''''''''''''''''''''''''
    
    '''''''''''''''''''''''''''''
    ' Save Custom Class - BEGIN '
    
    If ThisWorkbook.Worksheets("Class Info").Range("CstLvl") > 0 Then
        ThisWorkbook.Worksheets("Custom Class").Copy After:=ActiveSheet
        ActiveWorkbook.Worksheets(1).Activate
    End If
    
    ' Save Custom Class - END   '
    '''''''''''''''''''''''''''''
    
    '''''''''''''''''''''''''''''
    ' Save Custom Familiar - BEGIN '
    
    'If ThisWorkbook.Worksheets("Class Info Aux").Range("CustomFamiliarSelected") = True Then
    '    ThisWorkbook.Worksheets("Custom Familiar").Copy After:=ActiveSheet
    '    ActiveWorkbook.Worksheets(1).Activate
    'End If
    
    ' Save Custom Familiar - END   '
    '''''''''''''''''''''''''''''
    
    ActiveWorkbook.SaveAs Filename:= _
        fileToSave, _
        FileFormat:=xlNormal, Password:="", WriteResPassword:="", _
        ReadOnlyRecommended:=False, CreateBackup:=False
    ActiveWorkbook.Close
    Sheets("ExportSheet").Visible = exportVisible
    thisSheet.Select
    
    If doapp Then
        appDefault
    End If
    
    Application.SheetsInNewWorkbook = sheetsInWorkbook

End Sub
Sub PullFromExportSheet()
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If

'Race & Stats
    Range("BaseStats").Value = Range("ExportBaseStats").Value
    Range("RaceTxt").Value = Range("ExportRaceTxt").Value
    Range("StatBumps").Value = Range("ExportStatBumps").Value
    Range("CharacterDescription").Value = Range("ExportCharacterDescription").Value
    Range("Coins").Value = Range("ExportCoins").Value
    Range("CoinsOther").Value = Range("ExportCoinsOther").Value
    Range("CampaignName").Value = Range("ExportCampaignName").Value
    Range("GenderOverride").Value = Range("ExportGenderOverride").Value
    Range("RegionOverride").Value = Range("ExportRegionOverride").Value
    Range("EthnicityOverride").Value = Range("ExportEthnicityOverride").Value
    Range("DeityOverride").Value = Range("ExportDeityOverride").Value
    Range("FavoredWeaponOverride").Value = Range("ExportFavoredWeaponOverride").Value
    Range("CROverride").Value = Range("ExportCROverride").Value
    Range("Player").Value = Range("ExportPlayer").Value
    Range("ExperiencePoints").Value = Range("ExportExperiencePoints").Value
    Range("LABuyOff").Value = Range("ExportLABuyOff").Value
    
'Classes
    Range("ImportInProgress").Value = True
    Range("TblClassLvls").Value = Range("ExportClassLvls").Value
    Range("TblGestaltClassLvls").Value = Range("ExportGestaltClassLvls").Value
    Range("TblHitPoints").Value = Range("ExportHitPoints").Value
    Range("ImportInProgress").Value = False
        
'Templates
    Range("GenderTxt").Value = Range("ExportGender").Value
    Range("RegionTxt").Value = Range("ExportRegion").Value
    Range("RaceEthnicityTxt").Value = Range("ExportEthnicity").Value
    
    Range("TemplateSelection").Value = Range("ExportTemplateSelection").Value
    Range("TemplateSelectionLvl").Value = Range("ExportTemplateSelectionLvl").Value
    
    Range("RaceSelectionOptions").Value = Range("ExportRaceSelectionOptions").Value
    Range("TemplateSelectionOptions").Value = Range("ExportTemplateSelectionOptions").Value

'Prestige Classes
    Range("DragonkithSpell").Value = Range("DragonkithSpellExport").Value
    Range("SAMoSSpells").Value = Range("SAMoSSpellsExport").Value
    Range("TblCataclysmMageProphecies").Value = Range("ExportCataclysmMageProphecies").Value
    Range("RenegadeMastermakerComponents").Value = Range("ExportRMmComponents").Value

'Skills
    Range("TblSkillList").Value = Range("ExportSkillList").Value
    Range("TblSkillMatrix").Value = Range("ExportSkillMatrix").Value

'Skill Tricks
    Range("TblSkillTricksSelected").Value = Range("ExportSkillTricksSelected").Value

'Variants
    Range("ExportWasteHunter").Value = Range("WasteHunterCreature").Value
    
'Traits
    Range("TblTraitsSelected").Value = Range("ExportTraitsSelected").Value
    Range("TblTraitsListSelected").Value = Range("ExportTraitsListSelected").Value
    Range("TblUserTraits").Value = Range("ExportUserTraits").Value
    
'Flaws
    Range("TblFlawsSelected").Value = Range("ExportFlawsSelected").Value
    Range("TblUserFlaws").Value = Range("ExportUserFlaws").Value
    
'Maneuvers & Stances
    Range("TblManeuversSelected").Value = Range("ExportManeuversSelected").Value
    Range("TblManeuversReadied").Value = Range("ExportManeuversReadied").Value
    Range("TblToBPrCSelected").Value = Range("ExportToBPrC").Value
    
'Languages
    Range("TblLanguageList").Value = Range("ExportLanguageList").Value
    Range("TblLanguagesSelected").Value = Range("ExportLanguagesSelected").Value

'Enhancements
    Range("TblEnhancements").Value = Range("ExportEnhancements").Value
    Range("TblEnhancementSkills").Value = Range("ExportEnhancementSkills").Value
        
'Feats
    Range("BonusFeats").Value = Range("ExportBonusFeats").Value
    Range("TblFeatsSelected").Value = Range("ExportFeatsSelected").Value
    Range("TblBonusSelected").Value = Range("ExportBonusSelected").Value
    Range("TblListSelected").Value = Range("ExportListSelected").Value
    Range("TblSpellMastery").Value = Range("ExportSpellMastery").Value
    Range("TblFtArcaneThesis").Value = Range("ExportFtArcaneThesis").Value
    Range("TblSignatureSpell").Value = Range("ExportSignatureSpell").Value
    Range("TblCustomFeats").Value = Range("ExportCustomFeats").Value
    Range("TblCustomFeatsDesc").Value = Range("ExportCustomFeatsDesc").Value
    Range("TblEfficientItemCreationFeat").Value = Range("TblExportEfficientItemCreationFeat").Value
    Range("TblPermanentEminationFeat").Value = Range("TblExportPermanentEminationFeat").Value
    Range("TblSpellStowawayFeat").Value = Range("TblExportSpellStowawayFeat").Value
    Range("TblSpontaneousSpellFeat").Value = Range("TblExportSpontaneousSpellFeat").Value
    Range("TblTenaciousMagicFeat").Value = Range("TblExportTenaciousMagicFeat").Value
    Range("TblPsicrystalPowerFeat").Value = Range("TblExportPsicrystalPowerFeat").Value
    Range("TblSymbiontMastery").Value = Range("ExportSymbiontMastery").Value
    

'Armor
    Range("ArmorProps").Value = Range("ExportArmorProps").Value
    Range("TblArmorOverrides").Value = Range("ExportArmorOverrides").Value
    Range("ShieldProps").Value = Range("ExportShieldProps").Value
    Range("TblShieldOverrides").Value = Range("ExportShieldOverrides").Value

'Attacks
    Range("TblWeapon1Overrides").Value = Range("ExportWeapon1Overrides").Value
    Range("TblWeapon2Overrides").Value = Range("ExportWeapon2Overrides").Value
    Range("TblWeapon3Overrides").Value = Range("ExportWeapon3Overrides").Value
    Range("TblWeapon4Overrides").Value = Range("ExportWeapon4Overrides").Value
    Range("TblWeapon5Overrides").Value = Range("ExportWeapon5Overrides").Value
    Range("TblWeapon6Overrides").Value = Range("ExportWeapon6Overrides").Value

' Binder Vestiges Sheet Selections
    Range("VestigeChoice1").Value = Range("SvVestigeChoice1").Value
    Range("VestigeChoice2").Value = Range("SvVestigeChoice2").Value
    Range("VestigeChoice3").Value = Range("SvVestigeChoice3").Value
    Range("VestigeChoice4").Value = Range("SvVestigeChoice4").Value
    
    Range("PactAugChoice1").Value = Range("SvPactAugChoice1").Value
    Range("PactAugChoice2").Value = Range("SvPactAugChoice2").Value
    Range("PactAugChoice3").Value = Range("SvPactAugChoice3").Value
    Range("PactAugChoice4").Value = Range("SvPactAugChoice4").Value
    Range("PactAugChoice5").Value = Range("SvPactAugChoice5").Value

'Character Sheet I
    Range("TblConditionalModifiers").Value = Range("ExportTblConditionalModifiers").Value

'Character Sheet II
    'Equipment
    Range("TblEquipment1").Value = Range("ExportEquipment1").Value
    Range("TblEquipment2").Value = Range("ExportEquipment2").Value
    Range("TblWeights1").Value = Range("ExportWeights1").Value
    Range("TblWeights2").Value = Range("ExportWeights2").Value

    'Notes
    Range("TblNotes1").Value = Range("ExportNotes1").Value
    Range("TblNotes2").Value = Range("ExportNotes2").Value
    
    'Additional Notes
    Range("TblNotes3").Value = Range("ExportNotes3").Value
    Range("TblNotes4").Value = Range("ExportNotes4").Value
    
    'Game Log
    Range("TblGameLog").Value = Range("TblGameLogExport").Value
'If Range("GameLogXP").Value = True Then
'    Range("ExperiencePoints") = "=GameLogXPTotal"
'    Range("PP") = "=GameLogPP"
'    Range("GP") = "=GameLogGP + GameLogArt + GameLogGems + GameLogOtherGP"
'    Range("SP") = "=GameLogSP"
'    Range("CP") = "=GameLogCP"
'    Range("Art") = "=GameLogArt"
'    Range("Gems") = "=GameLogGems"
'    Range("OtherGP") = "=GameLogOtherGP"
'End If
        
    'LG Game Log
    Range("ARInfo1").Value = Range("ExportARInfo1").Value
    Range("ARInfo2").Value = Range("ExportARInfo2").Value
    Range("ARInfo3").Value = Range("ExportARInfo3").Value
    Range("ARInfo4").Value = Range("ExportARInfo4").Value
    
    'LG MIL Sheet
    Range("TblMIL").Value = Range("TblExportMIL").Value
    
    'LG Item Access Sheet
    Range("TblItemAccessList").Value = Range("ExportItemAccessList").Value
    
    'Buffs Sheet
    Range("BuffSpellsSelect").Value = Range("ExportBuffSpellsSelect").Value
    Range("BuffSpellsCasterLevel").Value = Range("ExportBuffSpellsCasterLevel").Value
    Range("BuffClassSelect").Value = Range("ExportBuffClassSelect").Value
    Range("BuffConditionalSelect").Value = Range("ExportBuffConditionalSelect").Value
    'Range("TblRaceBuffsSelected").Value = Range("ExportRaceBuffsSelected").Value
    Range("TblMiscBuffsSelected").Value = Range("ExportMiscBuffsSelected").Value
    Range("TblPsionicBuffsSelected").Value = Range("ExportPsionicBuffsSelected ").Value
    Range("TblAugPsionicBuffs").Value = Range("ExportAugPsionicBuffs").Value
    
    'Table Tent
    Range("TableTentPicture").Value = Range("ExportTableTentPicture").Value
    
    'Familiar Sheet
    Range("FamiliarName").Value = Range("ExportFamName").Value
    
    'Animal Companion Sheet
    Range("CompanionName").Value = Range("ExportCompName").Value
    Range("CompanionAge").Value = Range("ExportCompAge").Value
    Range("CompanionGender").Value = Range("ExportCompGender").Value
    Range("CompanionHeight").Value = Range("ExportCompHeight").Value
    Range("CompanionWeight").Value = Range("ExportCompWeight").Value
    Range("CompanionEyes").Value = Range("ExportCompEyes").Value
    Range("CompanionHair").Value = Range("ExportCompHair").Value
    Range("CompanionSkillRanks").Value = Range("ExportCompSkillRanks").Value
    Range("CompanionSkillMisc").Value = Range("ExportCompSkillMisc").Value
    Range("CompanionArmor").Value = Range("ExportCompArmor").Value
    Range("CompanionShield").Value = Range("ExportCompShield").Value
    Range("CompanionDeflect").Value = Range("ExportCompDeflect").Value
    Range("CompanionMiscAC").Value = Range("ExportCompMiscAC").Value

    'Application.Calculate
    
    If doapp Then
        appDefault
    End If

End Sub

Sub Import()
    ' Windows or Mac?
    ' These file-type filters could use to be refined
  Dim fileToOpen As Variant
  Dim osType As String
  Dim doapp As Boolean, IsBlankSheet As Boolean
  Dim thisSheet As Worksheet
  Dim ImportVersion As String, ImportMajor As Integer, ImportSource As Integer
  Dim HFVersion As String, HFMajor As Integer, HFSource As Integer
    
    Set thisSheet = ActiveSheet
    
    osType = Application.OperatingSystem
    If osType Like "*Windows*" Then
        fileToOpen = Application.GetOpenFilename( _
                fileFilter:="HeroForge Files (*.hfg), *.hfg")
    Else
        fileToOpen = Application.GetOpenFilename()
    End If
    
    'If they cancelled, don't do anything
    If fileToOpen = False Then Exit Sub
    
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    IsBlankSheet = (Application.WorksheetFunction.Sum(Range("BaseStats")) = 48) And _
      Range("Race") = "Human" And _
      (Application.WorksheetFunction.Sum(Range("TblClassLvls")) = 60) And _
      (Application.WorksheetFunction.Sum(Range("SkRanks")) = 0) And _
      (Application.WorksheetFunction.Sum(Range("FeatsCnt")) = 0)
    
    If Not (IsBlankSheet) Then
      HF_Reset ClearOptions:=True, AskConfirm:=False
    End If
    
    ' Get import file name and path
    Dim thatPath As String
    thatPath = fileToOpen
    If thatPath Like "*" & Application.PathSeparator & "*" Then
        Dim counter As Integer
        counter = Len(thatPath)
        Dim lastChar As String
        lastChar = Mid(thatPath, counter, 1)
        Dim that As String
        that = ""
        Do While lastChar <> Application.PathSeparator
            that = lastChar & that
            counter = counter - 1
            lastChar = Mid(thatPath, counter, 1)
        Loop
    Else
        that = thatPath
    End If
        
    Dim openedWB As Boolean
    If WorkbookIsOpen(that) Then
        openedWB = False
    Else
        Workbooks.Open thatPath, 0, True
        openedWB = True
    End If
    
    Application.MaxChange = 0.001
    ActiveWorkbook.PrecisionAsDisplayed = False
    
    Sheets("Exportsheet").Activate
        
    ImportVersion = Range("A2").Value
    ImportMajor = Range("A3").Value
    ImportSource = Range("A4").Value
    HFVersion = ThisWorkbook.Worksheets("Option Info").Range("Version").Value
    HFMajor = ThisWorkbook.Worksheets("Option Info").Range("VMajor").Value
    HFSource = ThisWorkbook.Worksheets("Option Info").Range("VSource").Value
    
'This will only work with single digit version numbers.
'(major/source/bugix must be identical)
    If ImportMajor <> HFMajor Or ImportSource <> HFSource Then
        MsgBox "Warning: " & Chr(13) & _
            "Unsupported import file version." & Chr(13) & _
            "You'll have to rebuild the character. ", _
            vbExclamation, "HeroForge Import"
        
        thisSheet.Activate
        ThisWorkbook.Worksheets("Stats & Character Details").Select
        Range("A1").Select
        Selection.Copy
        Set ThatWorkbook = Workbooks(that)
        If openedWB Then ThatWorkbook.Close False
        Set ThatWorkbook = Nothing
        thisSheet.Activate
        
        If doapp Then
            appDefault
        End If
        
        Exit Sub
    End If
    ''''''''''''''''''''''''''''
    ' Load Custom Race/Template - BEGIN '
    Dim ws As Worksheet
    Dim wsOldActive As Worksheet
    
    For Each ws In ActiveWorkbook.Worksheets
        If ws.Name = "Custom Race" Then
            ws.Range("D3:D47").Copy
            ThisWorkbook.Worksheets("Custom Race").Range("D3:D47").PasteSpecial xlPasteValues
            Set wsOldActive = ActiveSheet
            ThisWorkbook.Worksheets("Custom Race").Activate
            ThisWorkbook.ActiveSheet.Range("D3").Select
            ToggleRace True
            wsOldActive.Activate
        End If
        If ws.Name = "Custom Template" Then
            ws.Range("D3:D46").Copy
            ThisWorkbook.Worksheets("Custom Template").Range("D3:D47").PasteSpecial xlPasteValues
            Set wsOldActive = ActiveSheet
            ThisWorkbook.Worksheets("Custom Template").Activate
            ThisWorkbook.ActiveSheet.Range("D3").Select
            ToggleRace True
            wsOldActive.Activate
        End If
        
    Next
    ' Load Custom Race - END   '
    ''''''''''''''''''''''''''''
    
    '''''''''''''''''''''''''''''
    ' Load Custom Class - BEGIN '
    For Each ws In ActiveWorkbook.Worksheets
        If ws.Name = "Custom Class" Then
            ws.Range("C2:H29").Copy
            ThisWorkbook.Worksheets("Custom Class").Range("C2:H29").PasteSpecial xlPasteValues
            ws.Range("J2:J80").Copy
            ThisWorkbook.Worksheets("Custom Class").Range("J2:J80").PasteSpecial xlPasteValues
            Set wsOldActive = ActiveSheet
            ThisWorkbook.Worksheets("Custom Class").Activate
            ThisWorkbook.ActiveSheet.Range("A1").Select
            ToggleClass True
            wsOldActive.Activate
        End If
    Next
    ' Load Custom Class - END   '
    '''''''''''''''''''''''''''''
    
    ''''''''''''''''''''''''''''''''
    ' Load Custom Familiar - BEGIN '
    For Each ws In ActiveWorkbook.Worksheets
        If ws.Name = "Custom Familiar" Then
            ws.Range("B2:B31").Copy
            ThisWorkbook.Worksheets("Custom Familiar").Range("B2:B31").PasteSpecial xlPasteValues
            ws.Range("G3:H18").Copy
            ThisWorkbook.Worksheets("Custom Familiar").Range("G3:H18").PasteSpecial xlPasteValues
            ws.Range("G21:G22").Copy
            ThisWorkbook.Worksheets("Custom Familiar").Range("G21:G22").PasteSpecial xlPasteValues
            Set wsOldActive = ActiveSheet
            ThisWorkbook.Worksheets("Custom Familiar").Activate
            ThisWorkbook.ActiveSheet.Range("A1").Select
            ToggleCustomFamiliar True
            wsOldActive.Activate
        End If
    Next
    
    ' Load Custom Familiar - END   '
    ''''''''''''''''''''''''''''
    
    Sheets("ExportSheet").Activate
          
        Dim exportVisible As Boolean
        
        Cells.Select
        Selection.Copy
        
        exportVisible = ThisWorkbook.Worksheets("ExportSheet").Visible
    
        ThisWorkbook.Worksheets("ExportSheet").Visible = True
        ThisWorkbook.Worksheets("ExportSheet").Activate
        ThisWorkbook.Worksheets("ExportSheet").Range("A1").PasteSpecial
        ThisWorkbook.Worksheets("ExportSheet").Range("A1").Select
        ThisWorkbook.Worksheets("ExportSheet").Visible = exportVisible
    
    thisSheet.Activate
    ThisWorkbook.Worksheets("Stats & Character Details").Select
    Range("A1").Select
    Selection.Copy
    Set ThatWorkbook = Workbooks(that)
    If openedWB Then ThatWorkbook.Close False
    Set ThatWorkbook = Nothing
     
    Range("ImportAttack").Value = True
    PullFromExportSheet
    
    GestaltSelect
    InitiativeCard
    ShowMILSheet
    ShowGameLog
    UseGameLogXP
    UseGameLogTreasure
    ShowCharSheetIV
    ShowCharSheetV
    ShowtableTent
    ShowItemAccessSheet
    FeatsHideCheckbox
    FeatsHideEpicCheckbox
    FeatsHideDMGCheckbox
    Range("ImportAttack").Value = False
    
    Select Case Range("SettingTxt").Value
        
    Case "Living Greyhawk"

Sheets("Character Sheet I").Select
            With ActiveSheet
                .Shapes("LGPicture").Select
                Selection.ShapeRange.ZOrder msoBringToFront
                Range("t17").Select
            End With
            
            Sheets("Race & Stats").Select
            With ActiveSheet
                '.Shapes("Drop Down 53").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                '.Shapes("Drop Down 67").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                Range("B3").Select
            End With

    Case "Forgotten Realms"

Sheets("Character Sheet I").Select
            With ActiveSheet
                .Shapes("FRCSPicture").Select
                Selection.ShapeRange.ZOrder msoBringToFront
                Range("t15").Select
            End With
            
            Sheets("Stats & Character Details").Select
            With ActiveSheet
                '.Shapes("Drop Down 63").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                '.Shapes("Drop Down 68").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                Range("B3").Select
            End With
        
        Case "Eberron"

 Sheets("Character Sheet I").Select
            With ActiveSheet
                .Shapes("EBCSPicture").Select
                Selection.ShapeRange.ZOrder msoBringToFront
                Range("t15").Select
            End With
            
            Sheets("Stats & Character Details").Select
            With ActiveSheet
                '.Shapes("Drop Down 85").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                '.Shapes("Drop Down 88").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                Range("B3").Select
            End With
        
        Case "Ravenloft"

Sheets("Character Sheet I").Select
            With ActiveSheet
                .Shapes("RLCSPicture").Select
                Selection.ShapeRange.ZOrder msoBringToFront
                Range("t15").Select
            End With
            
            Sheets("Stats & Character Details").Select
            With ActiveSheet
                '.Shapes("Drop Down 53").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                '.Shapes("Drop Down 67").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                Range("B3").Select
            End With
            
        Case "Dragonlance"

  Sheets("Character Sheet I").Select
            With ActiveSheet
                .Shapes("DLCSPicture").Select
                Selection.ShapeRange.ZOrder msoBringToFront
                Range("t15").Select
            End With
            
            Sheets("Stats & Character Details").Select
            With ActiveSheet
                '.Shapes("Drop Down 342").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                '.Shapes("Drop Down 343").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                Range("B3").Select
            End With

Case Else
            Range("HRLivingGreyhawk").Value = False

 Sheets("Character Sheet I").Select
            With ActiveSheet
                .Shapes("DandDPicture").Select
                Selection.ShapeRange.ZOrder msoBringToFront
                Range("t15").Select
            End With
            
            Sheets("Stats & Character Details").Select
            With ActiveSheet
                '.Shapes("Drop Down 53").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                '.Shapes("Drop Down 67").Select
                'Selection.ShapeRange.ZOrder msoBringToFront
                Range("B3").Select
            End With
        
    End Select
   
   ' Restore campaign name
 
    Range("CampaignName").Value = Range("ExportCampaignName").Value
    
    
    Class_DropDown_Change
     
    ' Restore selected languages one more time (it might have been cleared by Class_DropDown_Change
    Range("TblLanguagesSelected").Value = Range("ExportLanguagesSelected").Value

'If Range("HasTemplate").Value Then
'    Sheets("Templates").Visible = True
'End If

  Sheets("Race & Templates").Visible = True

If Range("HasVariants").Value Then
    Sheets("Variants").Visible = True
End If

If Range("HasSkillTricks").Value Then
    Sheets("Skill Tricks").Visible = True
End If

If Range("HasTraits").Value Then
    Sheets("Traits").Visible = True
End If

If Range("HasFlaws").Value Then
    Sheets("Flaws").Visible = True
End If

If Range("HasManeuvers").Value Then
    Sheets("Maneuvers & Stances").Visible = True
End If

If Range("MartialClass").Value Then
    Sheets("Maneuvers & Stances").Visible = True
End If

If Range("HasMagicEquip").Value Then
    wsMagicEquipment.Visible = xlSheetVisible
End If

If Range("HasGraft").Value Then
    Sheets("Grafts").Visible = True
End If

    Range("VersionExport").Value = Range("ExportVersion").Value
  
    If doapp Then
        appDefault
    End If
   
End Sub

