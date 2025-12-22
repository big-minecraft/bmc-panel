import DeleteModal from './DeleteModal';
import MoveModal from './MoveModal';
import RenameModal from './RenameModal';
import EditorModal from './EditorModal';
import {useFilesState} from '../../context/FilesContext';

const ModalsContainer = () => {
    const {modals} = useFilesState();

    return (
        <>
            <DeleteModal
                isOpen={modals.delete.isOpen}
                files={modals.delete.files}
            />
            <MoveModal
                isOpen={modals.move.isOpen}
            />
            <RenameModal
                isOpen={modals.rename.isOpen}
                file={modals.rename.file}
            />
            <EditorModal
                isOpen={modals.editor.isOpen}
                file={modals.editor.file}
                content={modals.editor.content}
            />
        </>
    );
};

export default ModalsContainer;