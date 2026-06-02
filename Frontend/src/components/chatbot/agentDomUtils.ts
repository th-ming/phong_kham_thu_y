import { normalizeSearchText } from "../../utils/index";

export const getElementAgentLabel = (el: Element) => {
    const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const labelByFor = input.id ? document.querySelector(`label[for="${input.id}"]`)?.textContent || "" : "";
    const parentLabel = el.closest("label")?.textContent || "";
    return normalizeSearchText([
        labelByFor,
        parentLabel,
        input.getAttribute("aria-label"),
        input.getAttribute("placeholder"),
        input.getAttribute("title"),
        input.getAttribute("data-ai-id"),
        input.textContent
    ].filter(Boolean).join(" "));
};

export const isVisibleAgentElement = (el: Element) => {
    const htmlEl = el as HTMLElement;
    const style = window.getComputedStyle(htmlEl);
    const rect = htmlEl.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
};

export const findAgentControlByKeywords = <T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,>(
    selector: string,
    keywords: string[]
): T | null => {
    const normalizedKeywords = keywords.map(normalizeSearchText);
    return Array.from(document.querySelectorAll<T>(selector))
        .filter(isVisibleAgentElement)
        .find(el => normalizedKeywords.some(keyword => getElementAgentLabel(el).includes(keyword))) || null;
};

export const findAgentControlsByKeywords = <T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,>(
    selector: string,
    keywords: string[]
): T[] => {
    const normalizedKeywords = keywords.map(normalizeSearchText);
    return Array.from(document.querySelectorAll<T>(selector))
        .filter(isVisibleAgentElement)
        .filter(el => normalizedKeywords.some(keyword => getElementAgentLabel(el).includes(keyword)));
};

export const findAgentButtonByKeywords = (keywords: string[]): HTMLElement | null => {
    const normalizedKeywords = keywords.map(normalizeSearchText);
    return Array.from(document.querySelectorAll<HTMLElement>("button, a, [role='button'], [data-ai-id]"))
        .filter(isVisibleAgentElement)
        .find(el => normalizedKeywords.some(keyword => getElementAgentLabel(el).includes(keyword))) || null;
};
