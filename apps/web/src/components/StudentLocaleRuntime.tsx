'use client';

import { useEffect } from 'react';
import { getStoredLocale } from '../i18n/client';
import { defaultLocale, type Locale } from '../i18n/config';
import { translateStudentAttribute, translateStudentText } from '../i18n/studentTranslations';

const EXCLUDED_PREFIXES = ['/admin', '/instructor', '/portal'];
const TRANSLATED_ATTR_PREFIX = 'data-original-student-attr-';
const originalTextNodes = new WeakMap<Text, { original: string; translated: string }>();

function shouldTranslatePath(pathname: string) {
  return !EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isSkippableNode(node: Node) {
  const parent = node.parentElement;
  if (!parent) return true;
  return ['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'].includes(parent.tagName);
}

function translateTextNode(node: Text, locale: Locale) {
  if (isSkippableNode(node)) return;

  const current = node.nodeValue || '';
  let record = originalTextNodes.get(node);

  if (!record) {
    record = { original: current, translated: current };
    originalTextNodes.set(node, record);
  } else if (current !== record.original && current !== record.translated) {
    record.original = current;
  }

  const nextValue = locale === defaultLocale
    ? record.original
    : translateStudentText(record.original, locale);
  record.translated = nextValue;
  if (current !== nextValue) {
    node.nodeValue = nextValue;
  }
}

function translateElementAttribute(element: Element, attr: 'placeholder' | 'title' | 'aria-label', locale: Locale) {
  const current = element.getAttribute(attr);
  if (!current) return;

  const originalAttr = `${TRANSLATED_ATTR_PREFIX}${attr}`;
  const original = element.getAttribute(originalAttr) || current;
  if (!element.hasAttribute(originalAttr)) {
    element.setAttribute(originalAttr, original);
  }

  const nextValue = locale === defaultLocale ? original : translateStudentAttribute(original, locale);
  if (current !== nextValue) {
    element.setAttribute(attr, nextValue);
  }
}

function translateTree(root: ParentNode, locale: Locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach((node) => translateTextNode(node, locale));

  const elements = root instanceof Element ? [root, ...Array.from(root.querySelectorAll('*'))] : Array.from(root.querySelectorAll('*'));
  elements.forEach((element) => {
    translateElementAttribute(element, 'placeholder', locale);
    translateElementAttribute(element, 'title', locale);
    translateElementAttribute(element, 'aria-label', locale);
  });
}

export default function StudentLocaleRuntime() {
  useEffect(() => {
    if (!shouldTranslatePath(window.location.pathname)) return;

    let locale = getStoredLocale();
    document.documentElement.lang = locale;
    translateTree(document.body, locale);

    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

    window.alert = (message?: string) => {
      const text = typeof message === 'string' ? translateStudentText(message, locale) : message;
      return originalAlert(text);
    };

    window.confirm = (message?: string) => {
      const text = typeof message === 'string' ? translateStudentText(message, locale) : message;
      return originalConfirm(text);
    };

    const observer = new MutationObserver((mutations) => {
      locale = getStoredLocale();
      document.documentElement.lang = locale;

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              translateTextNode(node as Text, locale);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              translateTree(node as Element, locale);
            }
          });
        }

        if (mutation.type === 'characterData') {
          translateTextNode(mutation.target as Text, locale);
        }

        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          const attr = mutation.attributeName;
          if (attr === 'placeholder' || attr === 'title' || attr === 'aria-label') {
            translateElementAttribute(mutation.target as Element, attr, locale);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    const interval = window.setInterval(() => {
      const nextLocale = getStoredLocale();
      if (nextLocale !== locale) {
        locale = nextLocale;
        document.documentElement.lang = locale;
        translateTree(document.body, locale);
      }
    }, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, []);

  return null;
}
