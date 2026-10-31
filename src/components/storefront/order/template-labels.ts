import type { getTranslations } from 'next-intl/server';
import type { TemplateEditorLabels } from './TemplateEditor';
import type { PosterEditorLabels } from './PosterEditor';

type StoreT = Awaited<ReturnType<typeof getTranslations<'store'>>>;

/** The texts of TemplateEditor, in the page's language; `published`: editing a live page from the receipt. */
export function templateLabels(t: StoreT, published = false): TemplateEditorLabels {
  const k = (key: string) => t(`template.${key}` as Parameters<StoreT>[0]);
  return {
    hint: k('hint'),
    texts: k('texts'),
    photos: k('photos'),
    video: k('video'),
    preview: k('preview'),
    save: published ? k('finish') : k('save'),
    saved: k('saved'),
    saving: k('saving'),
    cancel: k('cancel'),
    done: k('done'),
    next: k('next'),
    back: k('back'),
    textPlaceholder: k('textPlaceholder'),
    addPhoto: k('addPhoto'),
    choosePhoto: k('choosePhoto'),
    frameTitle: k('frameTitle'),
    frameHint: k('frameHint'),
    frameCaption: k('frameCaption'),
    dragHint: t('photos.dragHint'),
    zoom: t('photos.zoom'),
    uploading: k('uploading'),
    wordsTitle: k('wordsTitle'),
    photoTitle: k('photoTitle'),
    photoCaption: k('photoCaption'),
    replacePhoto: t('photos.replace'),
    reframe: k('reframe'),
    removePhoto: t('photos.remove'),
    videoTitle: k('videoTitle'),
    videoHint: k('videoHint'),
    chooseVideo: k('chooseVideo'),
    replaceVideo: k('replaceVideo'),
    removeVideo: k('removeVideo'),
    converting: k('converting'),
    missing: t.raw('template.missing') as string,
    errors: {
      generic: t('photos.errors.generic'),
      tooLarge: k('errors.tooLarge'),
      unsupportedImage: t('photos.errors.unsupportedImage'),
      imageTooSmall: t('photos.errors.imageTooSmall'),
      unsupportedVideo: k('errors.unsupportedVideo'),
      rateLimited: t('photos.errors.rateLimited'),
      tooLong: k('errors.tooLong'),
      invalidText: k('errors.invalidText'),
      invalidChoice: k('errors.invalidText'),
    },
  };
}

/** The texts of PosterEditor, in the page's language. */
export function posterLabels(t: StoreT, published = false): PosterEditorLabels {
  const k = (key: string) => t(`posters.${key}` as Parameters<StoreT>[0]);
  return {
    title: k('title'),
    subtitle: k('subtitle'),
    landscape: k('landscape'),
    portrait: k('portrait'),
    main: k('main'),
    videoStill: k('videoStill'),
    row: t.raw('posters.row') as string,
    rowHint: k('rowHint'),
    drawing: k('drawing'),
    back: k('back'),
    next: published ? k('finish') : k('next'),
    error: t('photos.errors.generic'),
  };
}
