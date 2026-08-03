Attribute VB_Name = "Set_ResetRoutines"
Option Explicit

Sub HF_Reset_ClearOptions_AskConfirm()
    Call HF_Reset(True, True)
End Sub
Sub HF_Reset_NoClearOptions_AskConfirm()
    Call HF_Reset(False, True)
End Sub



Sub HF_Reset(Optional ClearOptions As Boolean, Optional AskConfirm As Boolean)

  Dim thisSheet As Worksheet
  Dim doapp As Boolean
  Dim DefaultCell As String, MsgTxt As String, ResetCmd As String
  Dim ResetList(), ResetSheet As Variant
    
    If ClearOptions Then
      MsgTxt = "Clear ALL Selections?"
    Else
      MsgTxt = "Clear ALL Selections BUT Options?"
    End If
      
    If AskConfirm Then
      If MsgBox(MsgTxt, vbYesNo + vbDefaultButton2, "Confirm Reset") <> vbYes Then
        Exit Sub
      End If
    End If
  
    With Application
      doapp = (.Cursor <> xlWait)
      If doapp Then
          appWait
      End If
      
      Set thisSheet = ActiveSheet
      
' The ordered elements in ResetList set the reset sequence.
      ResetList = Array("MagicEquipment", "Variants", "Grafts", "Buffs", "LGGameLog", "GameLog", "LGMIL", "CS3", "CS2", "CS1", "Enhancements", "Attacks", "Armor", "ManeuversStances", "Flaws", "Traits", "SkillTricks", "Skills", "Auras", "RaceTemplates", "StatsDescription", "Classes", "CustomFamiliar", "CustomRace", "CustomClass", "Options", "Languages", "Feats", "BinderSelection", "Soulmelds", "Incarnum", "AnimalCompanion")
      For Each ResetSheet In ResetList
        If ResetSheet <> "Options" Or ClearOptions Then
'Let's be a bit verbose on where we are:
          .StatusBar = "Resetting " & ResetSheet
          ResetCmd = ResetSheet & "_Reset"
          .Run ResetCmd
        End If
      Next ResetSheet
      
      .StatusBar = "Recalculating..."
      '.Calculate
      If doapp Then
        appDefault
        appWait
      End If
            ' needs to be done after HRReset (and after a calculate)
      Class_DropDown_Change
      
      .StatusBar = "Clearing Exportsheet"
      PushToExportSheet
      .StatusBar = ""
      
    End With
    
    If doapp Then
        appDefault
    End If
    
    With thisSheet
      .Activate
      DefaultCell = Range("tblSheets").Find(.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
      If LenB(DefaultCell) = 0 Then
        DefaultCell = "A1"
      End If
      .Range(DefaultCell).Select
    End With
    
    Set thisSheet = Nothing
    
End Sub

Sub Options_Reset()
    Dim ws As Worksheet
    Dim HR_Range As Range
    
    Dim doapp As Boolean
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    Set HR_Range = Application.Union(Range("HRSummarizeAbilities"), Range("InitSheet"), Range("CharSheetIV"), _
                                     Range("CharSheetV"), Range("TableTent"), Range("HRTraits"), Range("HRFlaws"), _
                                     Range("GameLog"), Range("ItemAccessSheet"), Range("HRGestalt") _
                                    )
    HR_Range.Value = False
    Range("HRHideTrained").Value = True
    Range("CampaignCell").Value = 1
    'Game Log Reset
    Sheets("LG Game Log").Visible = False
    Sheets("Game Log").Visible = False
    Range("GameLog, GameLogXP, GameLogTreasure").Value = False
    Range("ExperiencePoints, PP, GP, SP, CP, Art, Gems, OtherGP") = ""
       
    'Sourcebooks Reset
    Range("HRSources").Value = False
    
    GestaltSelect

    If doapp Then
        appDefault
    End If
     
    CampaignChange
    
    For Each ws In ThisWorkbook.Worksheets
        With ws
            If Range("tblSheets").Find(.CodeName, _
                LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 5) Then
                .Visible = xlSheetHidden
            End If
        End With
    Next ws
    
    Set HR_Range = Nothing
    
End Sub

Sub HRSetMost()
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
            
    Range("HRCW").Value = True
    Range("HRCD").Value = True
    Range("HRCA").Value = True
    Range("HRCAd").Value = True
    Range("HRCPs").Value = True
    Range("HRCM").Value = True
    Range("HRRoS").Value = True
    Range("HRCS").Value = True
    Range("HRCC").Value = True
    Range("HRRoD").Value = True
    Range("HRRotW").Value = True
    Range("HRRotD").Value = True
    Range("HRFrost").Value = True
    Range("HRSand").Value = True
    Range("HRSto").Value = True
    Range("HRHB").Value = True
    Range("HRHH").Value = True
    Range("HRToB").Value = True
    Range("HRToM").Value = True
    Range("HRSpC").Value = True
    Range("HRMH").Value = True
    
    Range("HRDS").Value = True
    Range("HRCi").Value = True
    
    Range("HRXPH").Value = True
    Range("HRPlH").Value = True
    Range("HRSS").Value = True
    
    Range("HRMM").Value = True
    Range("HRDr").Value = True
    Range("HRDrM").Value = True
    Range("HRLM").Value = True
    Range("HRLoM").Value = True
    
    Range("HRBoVD").Value = True
    Range("HRBoED").Value = True
    
    Range("HRPHB2").Value = True
    Range("HRMM2").Value = True
    Range("HRFF").Value = True
    Range("HRMM3").Value = True
    Range("HRMM4").Value = True
    Range("HRFCII").Value = True
    
    Range("HRDC").Value = True
    Range("HRSF").Value = True
    Range("HRMoI").Value = True
      
    
    If doapp Then
        appDefault
    End If
    
End Sub

Sub StatsDescription_Reset()
' Race/Stats Reset
    Dim doapp As Boolean
    Dim Race_Range As Range
    Dim DefaultCell As String
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    Set Race_Range = Application.Union(Range("StatBumps"), Range("CharacterDescription"), Range("Coins"), Range("CoinsOther"))
    Race_Range.ClearContents
    
    Set Race_Range = Application.Union(Range("DeityOverride"), Range("FavoredWeaponOverride"), Range("Player"), Range("ExperiencePoints"), _
                                       Range("CROverride"), Range("LABuyOff"))
    Race_Range.Value = vbNullString
    
    Set Race_Range = Application.Union(Range("AlignmentCell"), Range("TblStatBumps"), Range("DeityCell"))
    Race_Range.Value = 1
    
    Range("BaseStats").Value = 8
    Range("ValidateDeity") = True

    updateCampaignName
    
    If doapp Then
        appDefault
    End If
    
    With ActiveSheet
      If .Name = "Stats & Description" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
End Sub

Sub RaceTemplates_Reset()

  Dim Race_Range As Range
  Dim doapp As Boolean
  
  doapp = (Application.Cursor <> xlWait)
  If doapp Then
      appWait
  End If

  With wsRaceTemplates
    Set Race_Range = Application.Union(.Range("RaceTxt"), .Range("GenderTxt"), .Range("GenderOverride"), _
                                      .Range("RegionTxt"), .Range("RegionOverride"), .Range("RaceSelectionOptions"), _
                                      .Range("TemplateSelectionOptions"), .Range("TemplateSelectionLvl"), .Range("TemplateSelection"))
    Race_Range.Value = vbNullString
  End With
  
  With wsExportSheet
    Set Race_Range = Application.Union(.Range("RaceIgnoreSrc"), .Range("TemplateIgnoreSrc"), .Range("TemplateIgnorePrereq"))
    Race_Range.Value = False
  End With
  
  RaceChange
'  UpdateMonster Lycanthrope:=True
  
  If doapp Then
      appDefault
  End If

'    Dim Template_Range As Range
'
'    Set Template_Range = Application.Union(Range("TblTemplatesSelected"), Range("TblGhostAbilities"), Range("ManifestedCell"), _
'                                           Range("TblShadowAbilities"), Range("EvolvedSelected"))
'    Template_Range.Value = False
'
'    Set Template_Range = Application.Union(Range("LycanthropeFormCell"), Range("NaturalLycanthropeCell"), Range("HalfDragonCell"), _
'                                           Range("LichLevel"), Range("VampireLevel"), Range("HVSpecialAttack"), Range("ElementalSelected"), _
'                                           Range("VoidMindLevel"), Range("GraveTouchedGhoullevel"), Range("MummifiedLevel"), _
'                                           Range("MineralWarriorLevel"), Range("WichtlinLevel"), Range("OgreTitanLevel"))
'    Template_Range.Value = 1
'
'
'    Range("TblEvolvedUndeadDropdowns").Value = Range("TblEvolvedUndeadDropdownsReset").Value
'    Range("TblSwarmShifterDropdowns").Value = Range("TblSwarmShifterDropdownsReset").Value
'    Range("tblTemplateTimeStamp").ClearContents
'
'    TemplateCheck
    
End Sub

Sub Classes_Reset()
' Classes Reset
    Dim Classes_Range As Range
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    Range("RedoInProgress").Value = True

    ' need to reset feats as part of a class reset to clean up
    ' caster level choices
    Feats_Reset
    
    Set Classes_Range = Application.Union(Range("PrestigeCell"), Range("TblExpertSkills"), _
                                          Range("CommonerProf"), Range("AnimalCompanion"), Range("MountCell"), Range("FamiliarCell"), _
                                          Range("PsionDisciplineCell"), Range("MonkFeats"), Range("FavoredEnemies"), Range("RangerCombatStyle"), _
                                          Range("RogAbils"), Range("ArvSkills"), Range("TblDrShamanAbilities"), Range("TblDisciplineFocus"), _
                                          Range("SpecWizInfo"), Range("ShugenjaElementCell"), Range("ShugenjaOrderCell"), Range("TblFavoredEnemies"), _
                                          Range("KelanenFavoredWeaponCell"), Range("FavoredDRCell"), Range("FavoredEnergies"), Range("SpiritGuideCell"), _
                                          Range("DomainCells"), Range("WuJFeats"), Range("WuJElem"), Range("WrlEnergy1"), Range("WrlEnergy2"))
    Classes_Range.Value = 1
    
    Set Classes_Range = Application.Union(Range("TblVicesSelected"), Range("TblVicesConquered"), Range("ArdentMantlesSelected"), Range("NobleBonusClassSkillCell"), _
                                          Range("MagnificoBonusClassSkill"), Range("TblUARacialParagons1"), Range("TblHuPgSkills"), Range("DrNMartialWeaponCell"), _
                                          Range("FiendishCell"), Range("DragonCell"), Range("ElementalCell"), Range("RuatharMartialWeaponCell"), _
                                          Range("GeomancerInfo"), Range("HorizonWalkerInfo"), Range("HighArcana"), Range("HierophantAbilities"), _
                                          Range("DoomlordStat1"), Range("DoomlordStat2"), Range("ElementalWarriorElementCell"), Range("FleshwarperFamiliarTaint"), _
                                          Range("FleshwarperSecret"), Range("LorAbilMasterLvl"), Range("WildPlainsMountCell"), Range("BondRaceCell"), _
                                          Range("BonusSpellCasterIndex"), Range("SublimeBuddyClassCell"), Range("DragonkithCell"), Range("ManifesterIndex"), Range("MeldshaperIndex"))
    Classes_Range.Value = 1
    
    Set Classes_Range = Application.Union(Range("TblAnointSelf"), Range("TblAnointWeapon"), Range("EnergyCells"), Range("FavoredS"), _
                                          Range("DeformityCell"), Range("TblBlackMagicOil"), Range("TblBlackMagicElixir"), Range("FavoredS_1"), _
                                          Range("TblAnointedStatBumps"), Range("TblExoticWeaponTricks"), Range("MasterThrowerCells"), Range("NaturesWarriorCells"), _
                                          Range("StoneLordCells"), Range("SkillArtistryCells"), Range("TblMonkTattoos"), Range("Hulk1"), _
                                          Range("Hulk2"), Range("BondedSummonerElementCell"), Range("DragonSamuraiCell"), Range("CelestialCompanionCell"), _
                                          Range("UnseenSeerBonusDamage"), Range("ParagonsPathCell"), Range("SanctifiedOneAbilities"), Range("TblUnTBonusLevels"), _
                                          Range("EldeenRangerSectCell"), Range("FavoredE"), Range("WeretouchedMasterForm"), Range("ElementalArchonCell"))
    Classes_Range.Value = 1
    
    Set Classes_Range = Application.Union(Range("WearerOfPurpleCell"), Range("HpMKnowledgeCell"), Range("HpMSkillCell"), Range("WarWizardMartialCell"), _
                                          Range("SAMoSSpellType"), Range("HpPBlessings"), Range("OghmasInsightCell"), Range("MageKillerSaveCell"), _
                                          Range("EnlightenedSpiritAbilities"), Range("FavoredE_1"), Range("SaHSpecialAbility"), Range("ThGNatWeaponCell"), _
                                          Range("TblThGImbue"), Range("TblHdBHordeEnemy"), Range("AtavistPersonality"), Range("MoonSpeakerAbilities"), _
                                          Range("RunecasterAbilities"), Range("ThunderLore"), Range("NativeTies"), Range("ElementalRebuke"), _
                                          Range("LFWTerrain"), Range("TblPrSSelected"), Range("ConstellationPowers"), Range("ElementalScionGraft"), _
                                          Range("TblSteelLegionnaire"), Range("WoHsAbilities"), Range("AmbientSecrets"), Range("TotemicInsight"))
    Classes_Range.Value = 1
    
    Set Classes_Range = Application.Union(Range("ArcaneThesis"), Range("HeartsGrace"), Range("LegionScoutRegions"), Range("EternalKnowledge"), _
                                          Range("CrSWeaponProf"), Range("DiDrAugs"), Range("DrgLAuras"), Range("DfABreathEffects"), _
                                          Range("HWMSpecialAttacks"), Range("SWiEnergyResistance"), Range("SiftWingSurge1"), Range("SiftWingSurge2"), _
                                          Range("DraconicFistEnergyType"), Range("MChBonus"), Range("FavoredHPa"), Range("NinjaSpyWpns"), _
                                          Range("FavoredSSc"), Range("WeaponMasterWoC"))
    Classes_Range.Value = 1
    
    Set Classes_Range = Application.Union(Range("ClrNeutTurn"), Range("RisenMartyr"), Range("DedicatedPaladin"), Range("TaintedScholarInfo"), _
                                          Range("DracolexiInfo"), Range("LoreMasterInfo"), Range("Dishonorable"), Range("ThrallBonusCells"), _
                                          Range("PiousTemplarCell"), Range("WeaponMasterKiCritical"))
    Classes_Range.Value = False
    
    Set Classes_Range = Application.Union(Range("ExportWasteHunter"), Range("SAMoSSpellsExport"), Range("ExportWasteHunter"), Range("DragonkithSpellExport"), _
                                          Range("ExportCataclysmMageProphecies"))
    Classes_Range.Value = ""
    
    Range("TblClassLvls").Value = 1
    Range("TblGestaltClassLvls").Value = 1
    Range("TblHitPoints").ClearContents
    Range("FamiliarName").Value = ""
    
    With Sheets("ExportSheet")
        
        .Range("BonusSpellCasterNames").Value = "Select Spell Casting Class"
        .Range("SublimeBuddyClass").Value = "Select Spell Casting Class"
        .Range("ManifesterNames").Value = "Select Manifesting Class"
        .Range("MeldshaperNames").Value = "Select Meldshaping Class"
        .Range("TblAnointedIntBumps").Value = 0
        .Range("ExportCataclysmMageProphecies").Value = ""
        .Range("ExportRMmComponents") = 0

    End With
    
    With wsPrC2
        .Range("DragonkithSpell") = ""
    End With
    
    With wsPrC3
        .Range("TblCataclysmMageProphecies") = ""
        .Range("RenegadeMastermakerComponents") = 0
        .Range("SAMoSSpells") = ""
    End With
        
    'Application.Calculate
    If doapp Then
        appDefault
        appWait
    End If
    Range("RedoInProgress").Value = False
    Class_DropDown_Change
        
    If doapp Then
        Range("D2").Select
        appDefault
    End If
    
    Set Classes_Range = Nothing
    
End Sub

Sub Soulmelds_Reset()

    Dim Soulmelds_Range As Range
    Dim DefaultCell As String

    Range("SoulmeldsReset").Value = 1
    Set Soulmelds_Range = Application.Union(Range("EssentiaCrown"), Range("EssentiaHands"), Range("EssentiaFeet"), _
                                            Range("EssentiaArms"), Range("EssentiaBrow"), Range("EssentiaShoulders"), _
                                            Range("EssentiaHeart"), Range("EssentiaThroat"), Range("EssentiaWaist"), _
                                            Range("EssentiaSoul"), Range("EssentiaDouble1"), Range("EssentiaDouble2"), _
                                            Range("EssentiaDouble3"), Range("BonusEssentia"))
    Soulmelds_Range.Value = ""
    
    With ActiveSheet
      If .Name = "Soulmelds" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
                                            
End Sub

Sub Incarnum_Reset()

    Range("IncarnumResetRange").Value = ""
    
End Sub

Sub Auras_Reset()

    Range("AurasSelected").Value = False
    Range("ResistanceAuraEnergyType").Value = 1
    Range("EnergyAuraEnergyType").Value = 1
    
End Sub

Sub Skills_Reset()

    Dim Skills_Range As Range
    Dim DefaultCell As String
    
    Set Skills_Range = Application.Union(Range("TblSkillMatrix"), Range("TblCraftSkills"), Range("TblKnowSkills"), _
                                         Range("TblPerformSkills"), Range("TblProfessionSkills"))
    Skills_Range.ClearContents
    
    With ActiveSheet
      If .Name = "Skills" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
    Set Skills_Range = Nothing
    
End Sub

Sub SkillTricks_Reset()

    Range("TblSkillTricksSelected").Value = Range("TblSkillTrickReset").Value
    
End Sub

Sub ManeuversStances_Reset()

    Range("TblManeuversSelected").Value = Range("TblManeuversReset").Value
    Range("TblManeuversReadied").Value = Range("TblManeuversReadiedReset").Value
    Range("TblToBPrCSelected").Value = Range("ToBPrCReset").Value
    
End Sub

Sub Traits_Reset()

    Range("TblTraitsSelected").Value = Range("TblTraitsReset").Value
    Range("TblTraitsListSelected").Value = Range("TblTrListReset").Value
    
End Sub

Sub Flaws_Reset()

    Range("TblFlawsSelected").Value = Range("TblFlawsReset").Value
    
End Sub

Sub Languages_Reset(Optional Partial As Boolean)

    If IsMissing(Partial) Then
        Partial = True
    End If

    Dim currentSheet As Worksheet
'    Dim CutCopyMode As Boolean
    Dim DefaultCell As String
    
    Set currentSheet = ActiveSheet
    
    Dim doapp As Boolean
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    Sheets("Languages").Activate
    Range("TblLanguagesSelected").Value = False
    Application.Calculate
    If doapp Then
        appDefault
        appWait
    End If
    AutomaticLanguages
    If Not (Partial) Then
      Range("CustomLanguages").Value = ""
    End If
    
    If ActiveSheet.Name = "Languages" Then
      DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
      If LenB(DefaultCell) = 0 Then
        DefaultCell = "A1"
      End If
      Range(DefaultCell).Select
    End If
    
'    CutCopyMode = False
    currentSheet.Activate
    
    If doapp Then
        appDefault
    End If
    
End Sub

Sub Feats_Reset()

    Dim doapp As Boolean
    Dim RowIndex As Integer
    Dim Feat_Range As Range
    Dim DefaultCell As String
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    Set Feat_Range = Application.Union(Range("TblSpellMastery"), Range("TblFtArcaneThesis"), Range("TblSignatureSpell"), _
                                       Range("TblCustomFeats"), Range("TblCustomFeatsDesc"), Range("TblSymbiontMastery"), _
                                       Range("TblEfficientItemCreationFeat"), Range("TblPermanentEminationFeat"), Range("TblSpellStowawayFeat"), _
                                       Range("TblSpontaneousSpellFeat"), Range("TblTenaciousMagicFeat"), Range("TblPsicrystalPowerFeat"))
    Feat_Range.Value = ""
    
    Set Feat_Range = Application.Union(Range("TblExtraSlotCells"), Range("TblExtraSpellCells"), Range("TblPracticedSpellcasterCells"), _
                                       Range("TblExpandedKnowledgeCells"), Range("FeatSelectedLevel"), Range("TashalatoraCell"))
    Feat_Range.Value = 1
    
    Range("BonusFeats").Value = 0
    Range("TblAllFeatsSelected").Value = CVErr(xlErrNA)
    Range("TblListSelected").Value = Range("TblListReset").Value
    Range("TblBonusFeats").Value = 0
    
    For RowIndex = 1 To 3
        Call AdjustExtraSlotSpells(RowIndex)
        Call AdjustExtraSpells(RowIndex)
        Call AdjustPracticedSpellcasters(RowIndex)
        Call AdjustExpandedKnowledge(RowIndex)
    Next RowIndex
    
    Range("BonusFeatsSelection").Value = 1
    
    If doapp Then
        Range("D9").Select
        appDefault
    End If
    
    With ActiveSheet
      If .Name = "Feats" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
    FreeFeats
    
    Set Feat_Range = Nothing
    
End Sub

Sub Armor_Reset()

    Dim Armor_Range As Range
    Dim DefaultCell As String
    
    Set Armor_Range = Application.Union(Range("ArmorProps"), Range("TblArmorOverrides"), Range("ShieldProps"), Range("TblShieldOverrides"))
    Armor_Range.Value = ""
    Range("TblArmorCells").Value = 1
    
    With ActiveSheet
      If .Name = "Feats" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
    Set Armor_Range = Nothing
    
End Sub

Sub Attacks_Reset()

    Dim Attack_Range As Range
    Dim DefaultCell As String
    
    Set Attack_Range = Application.Union(Range("TblAttack1Cells"), Range("TblAttack2Cells"), Range("TblAttack3Cells"), _
                                         Range("TblAttack4Cells"), Range("TblAttack5Cells"), Range("TblAttack6Cells"))
    Attack_Range.Value = 1
    
    Set Attack_Range = Application.Union(Range("AttackSize1"), Range("AttackSize2"), Range("AttackSize3"), _
                                         Range("AttackSize4"), Range("AttackSize5"), Range("AttackSize6"))
    Attack_Range.Value = Range("SizeNumber").Value
    
    Set Attack_Range = Application.Union(Range("TblWeapon1Overrides"), Range("TblWeapon2Overrides"), Range("TblWeapon3Overrides"), _
                                         Range("TblWeapon4Overrides"), Range("TblWeapon5Overrides"), Range("TblWeapon6Overrides"))
    Attack_Range.ClearContents
    
    With ActiveSheet
      If .Name = "Attacks" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
       
    Set Attack_Range = Nothing
    
End Sub

Sub Enhancements_Reset()

  Dim DefaultCell As String
  
    Range("TblEnhancements").Value = 0
    Range("TblEnhancementSkills").Value = 0
    Range("DROverride").Value = ""
    Range("SROverride").Value = ""
    
    With ActiveSheet
      If .Name = "Enhancements" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
End Sub

Sub Grafts_Reset()

    Dim Grafts_Range As Range
    
    Set Grafts_Range = Application.Union(Range("TblGRMaug"), Range("TblGRAboleth"), _
                                         Range("TblGRBeholder"), Range("TblGRFiendish"), _
                                         Range("TblGRIllithid"), Range("TblGRSilthilar"), _
                                         Range("TblGRUndead"), _
                                         Range("TblGRYuanTi"), Range("TblGRDraconic") _
                                        )
    Grafts_Range.Value = False
    
    Set Grafts_Range = Nothing
    
    
    Range("TblGRBeholderDropdowns").Value = Range("TblGRBeholderDropdownsReset").Value
    Range("TblGRIllithidDropdowns").Value = Range("TblGRIllithidDropdownsReset").Value
    Range("ChitinPlateBonus").Value = False

End Sub

Sub CS1_Reset()
    Dim CSI_Range As Range
    
    Set CSI_Range = Application.Union(Range("CSStrTemp"), Range("CSDexTemp"), _
                                      Range("CSConTemp"), Range("CSIntTemp"), _
                                      Range("CSWisTemp"), Range("CSChaTemp"), _
                                      Range("CSFortTempMod"), Range("CSRefTempMod"), _
                                      Range("CSWillTempMod"), Range("CSMeleeTempMod"), _
                                      Range("CSRangedTempMod"), Range("CSBaseAtkMod"), _
                                      Range("Wounds") _
                                    )
    CSI_Range.Value = ""
    
    Set CSI_Range = Nothing
    
    Range("TblConditionalModifiers").ClearContents
End Sub

Sub CS2_Reset()
    'Dim CSII_Range As Range
    
    'Set CSII_Range = Application.Union(Range("TblEquipment1"), Range("TblEquipment2"), _
                                       Range("TblWeights1"), Range("TblWeights2"), _
                                       Range("TblNotes1"), Range("TblNotes2") _
                                      )
    'CSII_Range.ClearContents
    
    'Set CSII_Range = Nothing
    
    Range("TblEquipment1, TblEquipment2, TblWeights1,TblWeights2, TblNotes1, TblNotes2").ClearContents
End Sub

Sub CS3_Reset()
    'Additional Notes
    Range("TblNotes3").ClearContents
    Range("TblNotes4").ClearContents
End Sub

Sub CustomRace_Reset()
  ' Custom Race Reset
  Dim doapp As Boolean, DoRace As Boolean, DoTemplate As Boolean
  Dim DefaultCell As String, ButtonName As String

  doapp = (Application.Cursor <> xlWait)
  If doapp Then
    appWait
  End If
  
  On Error Resume Next
  ButtonName = Application.Caller
  If Err.Number > 0 Then
    DoRace = True
    DoTemplate = True
  Else
    If ButtonName = "cmdCustomRaceClear" Then
      DoRace = True
    Else
      DoTemplate = True
    End If
  End If
  On Error GoTo 0
  
  If DoRace Then
    Range("CustomRace").ClearContents
  End If
  
  If DoTemplate Then
    Range("CustomTemplate").ClearContents
  End If
  
  If doapp Then
  appDefault
  End If
  
  With ActiveSheet
  If .Name = "Custom Race" Then
  DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
  If LenB(DefaultCell) = 0 Then
  DefaultCell = "A1"
  End If
  .Range(DefaultCell).Select
  End If
  End With
End Sub

Sub CustomClass_Reset()
' Custom Class Reset
    Dim doapp As Boolean
    Dim DefaultCell As String
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    With Worksheets("Custom Class")
        .Range("C2:C6").ClearContents
    
        .Range("C8").Value = "POOR"
        .Range("C10:C12").Value = "POOR"
    
        .Range("C15:C18").ClearContents
    
        .Range("C21:C25").Value = "FALSE"
        .Range("C28:C29").Value = "FALSE"
    
        .Range("E4:G23").ClearContents
        .Range("J2:J80").Value = "NO"
    
        If doapp Then
            appDefault
        End If
    
    End With

    With ActiveSheet
      If .Name = "Custom Class" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
End Sub

Sub CustomFamiliar_Reset()
' Custom Class Reset
    Dim doapp As Boolean
    Dim DefaultCell As String
    
    doapp = (Application.Cursor <> xlWait)
    If doapp Then
        appWait
    End If
    
    With Worksheets("Custom Familiar")
        .Range("B2:B36").ClearContents
        .Range("G3:H22").ClearContents
    
        If doapp Then
            appDefault
        End If
    
    End With

    With ActiveSheet
      If .Name = "Custom Familiar" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
End Sub

Sub Buffs_Reset()

  Dim DefaultCell As String
  
    Range("BuffSpellsSelect").Value = Range("BuffSpellsSelectReset").Value
    Range("BuffSpellsCasterLevel").Value = Range("BuffSpellsCasterLevelReset").Value
    Range("BuffClassSelect").Value = Range("BuffClassSelectReset").Value
    Range("BuffConditionalSelect").Value = Range("BuffConditionalSelectReset").Value
    Range("'Buffs'!M40").Value = False ' (Shifter shifting)
    Range("TblMiscBuffsSelected").Value = Range("BuffsMiscSelectedReset").Value
    Range("Dreamtouched").Value = False ' (Dreamtouched)
    Range("TblPsionicBuffsSelected").Value = Range("BuffsPsionicSelectedReset").Value
    Range("TblAugPsionicBuffs").Value = ""
    Range("WildShapeCell").Value = 1
    
    With ActiveSheet
      If .Name = "Buffs" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
End Sub

Sub Variants_Reset()

    Dim DefaultCell As String

    Range("VariantsSelected").Value = False
    Range("VariantsSelectedCont").Value = False
    Range("CCSpiritualTotem").Value = 0
    Range("WasteHunterCreature").Value = ""
    
    Range("RSLSelected").Value = False
    Range("RslGnIll1SchoolSelected").Value = 1
    Range("RslChRogSkillSelected").Value = 1
    Range("RslShDrd1AbilitySelected").Value = 1
    Range("RslShDrd1TraitSelected").Value = 1
    Range("RslDBEnergyType").Value = 1
    Incarnum_Reset
    Meldshape_Feat_Change
    
    With ActiveSheet
      If .Name = "Variants" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
End Sub

Sub BinderSelection_Reset()
  Range("VestigeChoice1, VestigeChoice2, VestigeChoice3, VestigeChoice4").Value = ""
  Range("PactAugChoice1, PactAugChoice2, PactAugChoice3, PactAugChoice4, PactAugChoice5").Value = ""
  
  Range("KoSSVestigePatron").Value = 1
  Range("KoSSAlignedStrikeSel").Value = 1
End Sub
Sub AnimalCompanion_Reset()

    Dim DefaultCell As String

    Dim CompanionResetRange As Range
    
    Set CompanionResetRange = Application.Union(Range("CompanionName"), Range("CompanionAge"), _
                                      Range("CompanionGender"), Range("CompanionHeight"), _
                                      Range("CompanionWeight"), Range("CompanionEyes"), _
                                      Range("CompanionHair"), Range("CompanionStrTemp"), _
                                      Range("CompanionDexTemp"), Range("CompanionConTemp"), _
                                      Range("CompanionIntTemp"), Range("CompanionWisTemp"), _
                                      Range("CompanionChaTemp"), Range("CompanionFortTempMod"), _
                                      Range("CompanionRefTempMod"), Range("CompanionWillTempMod"), _
                                      Range("CompanionSkillRanks"), Range("CompanionSkillMisc"), _
                                      Range("CompanionArmor"), Range("CompanionShield"), _
                                      Range("CompanionDeflect"), Range("CompanionMiscAC"), _
                                      Range("CompanionGear"), Range("CompanionAmmo"), _
                                      Range("CompanionWounds"), Range("CompanionSubdual") _
                                    )
    CompanionResetRange.Value = ""
    Set CompanionResetRange = Nothing
    
    With ActiveSheet
      If .Name = "Animal Companion" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
    'Set AR_Range = Nothing
    
End Sub

Sub MagicEquipment_Reset()

    'Dim MagicEquipRange As Range
    
    'Set MagicEquipRange = Application.Union(Range("MagicEquipRingType1"), Range("MagicEquipRingBonus1"), _
                                            Range("MagicEquipHeadType"), Range("MagicEquipHeadBonus"), _
                                            Range("MagicEquipBodyType"), Range("MagicEquipBodyBonus"), _
                                            Range("MagicEquipRingType2"), Range("MagicEquipRingBonus2"), _
                                            Range("MagicEquipFaceType"), Range("MagicEquipFaceBonus"), _
                                            Range("MagicEquipTorsoType"), Range("MagicEquipTorsoBonus"), _
                                            Range("MagicEquipHandType"), Range("MagicEquipHandBonus"), _
                                            Range("MagicEquipNeckType"), Range("MagicEquipNeckBonus"), _
                                            Range("MagicEquipWaistType"), Range("MagicEquipWaistBonus"), _
                                            Range("MagicEquipArmType"), Range("MagicEquipArmBonus"), _
                                            Range("MagicEquipShoulderType"), Range("MagicEquipShoulderBonus"), _
                                            Range("MagicEquipFeetType"), Range("MagicEquipFeetBonus") _
                                           )
    'MagicEquipRange.Value = 1

    'Set MagicEquipRange = Nothing
    
  Range("MagicEquipReset").Value = 1
    
'Range("MagicEquipRingType1").Value = 1
'Range("MagicEquipRingBonus1").Value = 1

'Range("MagicEquipHeadType").Value = 1
'Range("MagicEquipHeadBonus").Value = 1

'Range("MagicEquipBodyType").Value = 1
'Range("MagicEquipBodyBonus").Value = 1

'Range("MagicEquipRingType2").Value = 1
'Range("MagicEquipRingBonus2").Value = 1

'Range("MagicEquipFaceType").Value = 1
'Range("MagicEquipFaceBonus").Value = 1

'Range("MagicEquipTorsoType").Value = 1
'Range("MagicEquipTorsoBonus").Value = 1

'Range("MagicEquipHandType").Value = 1
'Range("MagicEquipHandBonus").Value = 1

'Range("MagicEquipNeckType").Value = 1
'Range("MagicEquipNeckBonus").Value = 1

'Range("MagicEquipWaistType").Value = 1
'Range("MagicEquipWaistBonus").Value = 1

'Range("MagicEquipArmType").Value = 1
'Range("MagicEquipArmBonus").Value = 1

'Range("MagicEquipShoulderType").Value = 1
'Range("MagicEquipShoulderBonus").Value = 1

'Range("MagicEquipFeetType").Value = 1
'Range("MagicEquipFeetBonus").Value = 1
End Sub

Sub LGGameLog_Reset()

    'Dim AR_Range As Range
    Dim DefaultCell As String
    
    'Set AR_Range = Application.Union(Range("ARInfo1"), Range("ARInfo2"), Range("ARInfo3"), Range("ARInfo4"))
    
    'AR_Range.ClearContents
    Range("ARInfo1, ARInfo2, ARInfo3, ARInfo4").ClearContents
    Worksheets("LG Game Log").Range("C30").Value = "Character Creation"
    
    With ActiveSheet
      If .Name = "LG Game Log" Then
        DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
        If LenB(DefaultCell) = 0 Then
          DefaultCell = "A1"
        End If
        .Range(DefaultCell).Select
      End If
    End With
    
    'Set AR_Range = Nothing
    
End Sub

Sub LGMIL_Reset()

    Range("TblMIL").Value = Range("TblMILClear").Value
    
End Sub

Sub GameLog_Reset()

  Dim DefaultCell As String
  
  Range("TblGameLog").ClearContents
    
  With ActiveSheet
    If .Name = "Game Log" Then
      DefaultCell = Range("tblSheets").Find(ActiveSheet.CodeName, LookIn:=xlValues, lookat:=xlWhole, searchorder:=xlByRows).Offset(0, 10).Value
      If LenB(DefaultCell) = 0 Then
        DefaultCell = "A1"
      End If
      .Range(DefaultCell).Select
    End If
  End With
    
End Sub
