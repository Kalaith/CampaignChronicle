import React from 'react';
import { DiceRoller } from '../components/DiceRoller';

const DiceRollerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dice Roller</h1>
        <p className="text-gray-600 mt-1">
          Roll dice with advanced features including templates, probability calculations, and roll history.
        </p>
      </div>
      
      <DiceRoller 
        showHistory={true}
        context="Campaign Session"
      />
    </div>
  );
};

export default DiceRollerPage;