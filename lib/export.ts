import { toJpeg, toPng, toSvg } from 'html-to-image';

export type ExportFormat = 'png' | 'svg' | 'jpeg';

export async function exportDiagram(
  element: HTMLElement,
  format: ExportFormat = 'png',
  filename = 'architecture-diagram'
): Promise<void> {
  let dataUrl: string;
  const options = {
    backgroundColor: '#0f0f0f',
    pixelRatio: 2, // high-res
    filter: (node: HTMLElement) => {
      // Exclude React Flow controls and minimap from export
      if (node.classList) {
        return (
          !node.classList.contains('react-flow__controls') &&
          !node.classList.contains('react-flow__minimap') &&
          !node.classList.contains('react-flow__panel')
        );
      }
      return true;
    },
  };

  switch (format) {
    case 'svg':
      dataUrl = await toSvg(element, options);
      break;
    case 'jpeg':
      dataUrl = await toJpeg(element, { ...options, quality: 0.95 });
      break;
    case 'png':
    default:
      dataUrl = await toPng(element, options);
  }

  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  link.click();
}
