/* IPAX Scoring System v0.1.20 • 2026-10-22
 * Santiago Bustelo, https://ipax.bustelo.com.ar/ */

import { renderPreviewTo } from '../ui-app.js';
import { IPAXOrchestrator } from '../../../dist-js/orchestrator.js';
import { apcaEngine, apcaFontLookup } from '../apca-bridge.js';

export class MapInspector {
    constructor(splitId, leftId, resizerId, rightId, chkId, readoutId, previewBoxId) {
        this.split = document.getElementById(splitId);
        this.panelLeft = document.getElementById(leftId);
        this.resizer = document.getElementById(resizerId);
        this.panelRight = document.getElementById(rightId);
        this.chk = document.getElementById(chkId);
        this.readout = document.getElementById(readoutId);
        this.previewBox = document.getElementById(previewBoxId);
        
        this.overlayHeader = document.getElementById('sampler-overlay-header');
        this.overlayInfo = document.getElementById('sampler-overlay-info');
        this.samplerLink = document.getElementById('preview-link-sampler');

        this.rawResizer = document.getElementById('raw-resizer');
        this.rawDataBox = document.getElementById('raw-data-box');
        this.dumpRawJson = document.getElementById('dump-raw-json');
        this.previewTopBox = document.querySelector('.map-preview-top-box');
        this.btnCopyDump = document.querySelector('[data-j0-action="dump:copy"]');

        if (!this.split) return;

        this.isResizing = false;
        this.isResizingRaw = false;
        this.isPinned = false;
        this.pinnedCoords = null;
        this.pinnedPayload = null;
        this.defaultPayload = null;
        this.lastValidPayload = null;

        this.bindEvents();
    }

    bindEvents() {
        if (this.chk) {
            this.chk.addEventListener('change', (e) => {
                const show = e.target.checked;
                this.resizer.style.display = show ? 'block' : 'none';
                this.panelRight.style.display = show ? 'flex' : 'none';
                if (!show) {
                    this.panelLeft.style.flex = '1 1 100%';
                    this.panelLeft.style.width = '100%';
                } else {
                    this.panelLeft.style.flex = '0 0 65%';
                    this.panelLeft.style.width = '65%';
                    this.restoreActiveOrFallback();
                }
            });
        }

        if (this.resizer) {
            this.resizer.addEventListener('mousedown', (e) => {
                this.isResizing = true;
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            });

            window.addEventListener('mousemove', (e) => {
                if (!this.isResizing) return;
                const rect = this.split.getBoundingClientRect();
                const leftWidth = e.clientX - rect.left;
                const percentage = Math.max(15, Math.min(85, (leftWidth / rect.width) * 100));
                
                this.panelLeft.style.flex = `0 0 ${percentage}%`;
                this.panelLeft.style.width = `${percentage}%`;
            });

            window.addEventListener('mouseup', () => {
                if (this.isResizing) {
                    this.isResizing = false;
                    document.body.style.cursor = '';
                }
            });
        }

        if (this.rawResizer && this.previewTopBox && this.rawDataBox) {
            this.rawResizer.addEventListener('mousedown', (e) => {
                this.isResizingRaw = true;
                document.body.style.cursor = 'row-resize';
                e.preventDefault();
            });

            window.addEventListener('mousemove', (e) => {
                if (!this.isResizingRaw) return;
                const rect = this.panelRight.getBoundingClientRect();
                const topHeight = e.clientY - rect.top;
                const percentage = Math.max(15, Math.min(85, (topHeight / rect.height) * 100));

                this.previewTopBox.style.flex = `0 0 ${percentage}%`;
                this.rawDataBox.style.flex = `1 1 ${100 - percentage}%`;
            });

            window.addEventListener('mouseup', () => {
                if (this.isResizingRaw) {
                    this.isResizingRaw = false;
                    document.body.style.cursor = '';
                }
            });
        }

        if (this.btnCopyDump && this.dumpRawJson) {
            this.btnCopyDump.addEventListener('click', () => {
                const textToCopy = this.dumpRawJson.textContent;
                if (!textToCopy) return;

                const doFeedback = () => {
                    const originalText = this.btnCopyDump.textContent;
                    this.btnCopyDump.textContent = 'Copied!';
                    setTimeout(() => {
                        this.btnCopyDump.textContent = originalText;
                    }, 1500);
                };

                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(textToCopy).then(doFeedback).catch(err => {
                        console.error('Copy failed:', err);
                    });
                } else {
                    try {
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        textArea.style.top = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        const ok = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        if (ok) doFeedback();
                    } catch (err) {
                        console.error('Fallback copy failed:', err);
                    }
                }
            });
        }

        if (window.j0 && window.j0.bus) {
            window.j0.bus.on('map:default-payload-updated', ({ defaultPayload, matrix }) => {
                this.defaultPayload = defaultPayload;
                this.matrix = matrix;

                if (this.isPinned && this.pinnedCoords) {
                    const newPinned = this.matrix[this.pinnedCoords.y][this.pinnedCoords.x];
                    if (newPinned) {
                        this.pinnedPayload = newPinned;
                        this.updateUI(newPinned);
                        this.showOverlay(newPinned);
                        return;
                    }
                }

                this.restoreActiveOrFallback();
            });

            window.j0.bus.on('map:inspector-update', (payload) => {
                if (payload && payload.score !== null) {
                    this.lastValidPayload = payload;
                }
                this.updateUI(payload);
            });

            window.j0.bus.on('map:crosshair-pinned-payload', ({ payload, x, y }) => {
                this.isPinned = true;
                this.pinnedCoords = { x, y };
                this.pinnedPayload = payload;

                if (this.chk && !this.chk.checked) {
                    this.chk.checked = true;
                    this.chk.dispatchEvent(new Event('change'));
                }

                this.updateUI(payload);
                this.showOverlay(payload);
            });

            window.j0.bus.on('map:crosshair-leave', () => {
                this.restoreActiveOrFallback();
            });
        }
    }

    restoreActiveOrFallback() {
        if (this.isPinned && this.pinnedPayload) {
            this.updateUI(this.pinnedPayload);
            this.showOverlay(this.pinnedPayload);
        } else {
            const fallback = this.lastValidPayload || this.defaultPayload;
            if (fallback) {
                this.updateUI(fallback);
            }
            this.hideOverlay();
        }
    }

    updateUI(payload) {
        if (!payload) return;

        const txtHex = payload.input.text;
        const bgHex = payload.input.bg;

        if (this.readout) {
            this.readout.innerHTML = `
                <span class="map-swatch-badge" style="background-color: ${bgHex}; color: ${txtHex};">Aa</span>
                <code>${txtHex}</code> over <code>${bgHex}</code>
                <span class="ipax-muted" style="margin-left: 10px;">| IPAX: ${payload.score.toFixed(2)} | WCAG: ${payload.wcag.ratio.toFixed(2)} | APCA: ${payload.apca.lc !== null ? payload.apca.lc : 'N/A'}</span>
            `;
        }

        if (this.dumpRawJson) {
            this.dumpRawJson.textContent = JSON.stringify(payload, null, 2);
        }

        if (this.panelRight && this.chk && this.chk.checked) {
            this.panelRight.style.backgroundColor = bgHex;
            this.panelRight.style.color = txtHex;

            const resBold = IPAXOrchestrator.getScore({
                colors: { text: txtHex, bg: bgHex },
                context: { fontWeight: 700 },
                env: { apcaEngine: apcaEngine, apcaFontLookup: apcaFontLookup },
                dict: { penalties: [], rewards: [] }
            });

            if (typeof renderPreviewTo === 'function') {
                renderPreviewTo(this.previewBox, payload, resBold, txtHex, bgHex);
            }
        }
    }

    showOverlay(payload) {
        if (!this.overlayHeader) return;

        const txtHex = payload.input.text;
        const bgHex = payload.input.bg;

        if (this.overlayInfo) {
            this.overlayInfo.innerHTML = `
                <span>Fixed:</span>
                <span class="map-swatch-badge" style="background-color: ${bgHex}; color: ${txtHex};">Aa</span>
                <span>${txtHex} over ${bgHex}</span>
            `;
        }

        if (this.samplerLink) {
            const txtClean = txtHex.replace('#', '').toUpperCase();
            const bgClean = bgHex.replace('#', '').toUpperCase();
            this.samplerLink.href = `https://ipax.bustelo.com.ar/sampler.php?m=sample&bg=${bgClean}&txt=${txtClean}`;
        }

        this.overlayHeader.style.display = 'flex';
    }

    hideOverlay() {
        if (this.overlayHeader) {
            this.overlayHeader.style.display = 'none';
        }
    }
}