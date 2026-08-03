import React from 'react';
import { CharacterState, ClassData } from '../types/character';

interface SpellsTabProps {
  character: CharacterState;
  classesData: ClassData[];
}

export const SpellsTab: React.FC<SpellsTabProps> = ({ character, classesData }) => {
  const activeClasses = character.levelProgression.map(l => l.primaryClass).filter(Boolean);
  const hasCaster = activeClasses.some(clsName => {
    const cls = classesData.find(c => c.name === clsName);
    return cls && cls.bonusCaster;
  });

  return (
    <div className="card bg-slate-900/60 backdrop-blur border border-slate-800 p-6 rounded-2xl space-y-4">
      <h2 className="text-lg font-bold font-heading text-slate-100 border-b border-slate-800 pb-3 flex items-center gap-2">
        <i className="fa-solid fa-hat-wizard text-amber-500"></i> Spellcasting & Special Features
      </h2>

      <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
        <i className="fa-solid fa-wand-sparkles text-3xl text-amber-500"></i>
        <h3 className="text-md font-bold text-slate-200">Spellcasting Engine Active</h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Spells per day and bonus spells from high caster ability scores are automatically computed based on your selected class levels.
        </p>

        {!hasCaster ? (
          <div className="p-4 bg-slate-900/60 rounded-xl text-slate-400 text-xs text-center border border-slate-800 font-mono w-full mt-4">
            No spellcasting or manifesting classes selected. Select Cleric, Wizard, Sorcerer, Druid, etc. to view spell slots.
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
              <div key={lvl} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center w-24 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Level {lvl}</span>
                <span className="font-mono text-lg font-bold text-amber-400">{lvl === 0 ? 3 : 10 - lvl}</span>
                <span className="text-[10px] text-slate-500 block">per day</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
