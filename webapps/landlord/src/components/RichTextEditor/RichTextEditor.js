import {
  addTextChangeListener,
  createTextEditor,
  destroyTextEditor,
  getHTML,
  insertField,
  printHandler,
  redoHandler,
  undoHandler,
} from './texteditor';
import {
  AppBar,
  Box,
  Button,
  Divider,
  TextField,
  Toolbar,
  Typography,
  withStyles,
} from '@material-ui/core';
import { useCallback, useEffect, useRef, useState } from 'react';

import _ from 'lodash';
import FieldBar from './FieldBar';
import jsesc from 'jsesc';
import PrintIcon from '@material-ui/icons/Print';
import RedoIcon from '@material-ui/icons/Redo';
import SaveIcon from '@material-ui/icons/SaveOutlined';
import { toHandlebars } from './transformer';
import UndoIcon from '@material-ui/icons/Undo';
import { useTimeout } from '../../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

const SAVE_DELAY = 250;
const CLEAR_SAVE_LABEL_DELAY = 2500;

const RichTextEditorBar = withStyles((theme) => ({
  root: {
    zIndex: theme.zIndex.drawer + 1,
  },
}))(AppBar);

const RichTextEditor = ({
  onLoad,
  onSave,
  onClose,
  title: initialTitle,
  fields = [],
  showPrintButton,
  placeholder = '',
}) => {
  const { t } = useTranslation('common');
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState(initialTitle || t('Untitled document'));
  const [saveData, setSaveData] = useState();
  const [saving, setSaving] = useState();
  const editorRef = useRef();
  const editorToolbarRef = useRef();
  const editorWrapper = useRef();
  const triggerClearSaveState = useTimeout(() => {
    setSaving();
  }, CLEAR_SAVE_LABEL_DELAY);
  const triggerSaveContents = useTimeout(() => {
    if (editorRef.current) {
      setSaveData({
        title,
        contents: editorRef.current.getContents(),
      });
    }
  }, SAVE_DELAY);
  const triggerSaveTitle = useTimeout((value) => {
    setSaveData({
      title: value,
      contents: editorRef.current.getContents(),
    });
  }, SAVE_DELAY);

  useEffect(() => {
    const save = async () => {
      if (!ready) {
        return;
      }

      try {
        setSaving(true);
        await onSave(
          saveData.title,
          saveData.contents,
          jsesc(await toHandlebars(getHTML()))
        );
        setSaving(false);

        triggerClearSaveState.start();
      } catch (error) {
        console.log(error);
      }
    };
    save();
  }, [saveData, onSave]);

  useEffect(() => {
    const load = async () => {
      // Create the HTML editor and TextEditor
      const toolbar = editorToolbarRef.current;
      const wrapper = editorWrapper.current;

      editorRef.current = createTextEditor(toolbar, wrapper);

      // load document
      const data = await onLoad();
      if (!data) {
        editorRef.current.setText(placeholder);
      } else {
        try {
          editorRef.current.setContents(data);
        } catch (error) {
          console.error(error);
          editorRef.current.setContents(placeholder);
        }
      }
      setSaveData({
        title,
        contents: editorRef.current.getContents(),
      });
      setReady(true);

      addTextChangeListener(() => {
        triggerClearSaveState.clear();
        setSaving();

        triggerSaveContents.start();
      });
    };
    load();

    return () => {
      destroyTextEditor();
    };
  }, []);

  const onInsertField = useCallback((field) => insertField(field), []);

  const onPrint = useCallback(printHandler, []);
  const onUndo = useCallback(undoHandler, []);
  const onRedo = useCallback(redoHandler, []);

  const onTitleChange = useCallback(
    (evt) => {
      setTitle(evt.target.value);
      triggerSaveTitle.start(evt.target.value);
    },
    [setTitle]
  );

  return (
    <>
      <RichTextEditorBar position="fixed">
        <Toolbar>
          <Box
            display={ready ? 'flex' : 'none'}
            alignItems="center"
            justifyContent="space-between"
            width="100%"
          >
            <Box display="flex" flexDirection="column" flexGrow={1}>
              <Box display="flex" alignItems="center" m={1}>
                <Box>
                  <TextField value={title} onChange={onTitleChange} />
                </Box>
                <Box color="text.disabled" ml={2}>
                  {saving === true && (
                    <Box display="flex" alignItems="center">
                      <SaveIcon fontSize="small" color="inherit" />
                      <Typography
                        variant="caption"
                        color="inherit"
                        component="span"
                      >
                        {t('Saving')}
                      </Typography>
                    </Box>
                  )}
                  {saving === false && (
                    <Typography variant="caption">{t('Saved')}</Typography>
                  )}
                </Box>
              </Box>
              <Box
                ref={editorToolbarRef}
                display="flex"
                flexGrow={1}
                flexWrap="nowrap"
                mb={1.5}
              >
                <button onClick={onUndo}>
                  <UndoIcon fontSize="small" />
                </button>
                <button onClick={onRedo}>
                  <RedoIcon fontSize="small" />
                </button>
                <Divider orientation="vertical" flexItem />
                <select className="ql-header" defaultValue={''}>
                  <option value="1"></option>
                  <option value="2"></option>
                  <option value="3"></option>
                  <option value="4"></option>
                  <option value="5"></option>
                  <option value="6"></option>
                  <option></option>
                </select>
                <Divider orientation="vertical" flexItem />

                <select className="ql-font"></select>
                <button className="ql-bold"></button>
                <button className="ql-italic"></button>
                <button className="ql-underline"></button>
                <button className="ql-strike"></button>
                <button className="ql-color"></button>
                <button className="ql-background"></button>
                <Divider orientation="vertical" flexItem />

                <button className="ql-link"></button>
                <button className="ql-image"></button>
                <Divider orientation="vertical" flexItem />

                <select className="ql-align"></select>
                <Divider orientation="vertical" flexItem />

                <button className="ql-list" value="ordered"></button>
                <button className="ql-list" value="bullet"></button>
                <Divider orientation="vertical" flexItem />

                <button className="ql-script" value="sub"></button>
                <button className="ql-script" value="super"></button>
                <Divider orientation="vertical" flexItem />

                <button className="ql-blockquote"></button>
                <Divider orientation="vertical" flexItem />

                <button className="ql-code-block"></button>
                <Divider orientation="vertical" flexItem />

                <button className="ql-clean"></button>
              </Box>
            </Box>

            <Box display="flex">
              {showPrintButton && (
                <Box mr={2}>
                  <Button onClick={onPrint}>
                    <PrintIcon />
                  </Button>
                </Box>
              )}
              <Button variant="contained" size="small" onClick={onClose}>
                {t('Close')}
              </Button>
            </Box>
          </Box>
        </Toolbar>
      </RichTextEditorBar>

      <Box ml={8} mt={14} display="flex" ref={editorWrapper} />

      <Toolbar />
      {!!fields.length && (
        <FieldBar onInsertField={onInsertField} fields={fields} />
      )}
    </>
  );
};

export default RichTextEditor;
