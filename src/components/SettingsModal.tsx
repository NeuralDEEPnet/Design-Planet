import { useState } from 'react';
import { Modal, Button, Field, Input } from './ui';

export const SettingsModal: React.FC<{ apiKey: string; onSave: (key: string) => void; onClose: () => void }> = ({ apiKey, onSave, onClose }) => {
  const [value, setValue] = useState(apiKey);
  const [show, setShow] = useState(false);
  return (
    <Modal
      title="Settings"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => { onSave(value.trim()); onClose(); }}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Gemini API key" hint="Stored only in this browser (localStorage) and sent only to Google's Gemini API. Get one at aistudio.google.com.">
          <div className="flex gap-2">
            <Input type={show ? 'text' : 'password'} value={value} onChange={(e) => setValue(e.target.value)} placeholder="AIza..." autoComplete="off" spellCheck={false} />
            <Button variant="secondary" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</Button>
          </div>
        </Field>
        <div className="text-xs text-muted space-y-1 bg-surface2 rounded-lg p-3 border border-line">
          <p className="font-semibold text-fg">Models used</p>
          <p>Reasoning and copy: gemini-2.5-flash. Images: imagen-4.0-generate-001. Edits: gemini-2.5-flash-image.</p>
          <p>Without a key you can still explore the sample project, edit copy, audit HTML and export kits.</p>
        </div>
      </div>
    </Modal>
  );
};
