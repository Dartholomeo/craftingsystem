Hooks.once("ready", () => {
  console.log("🛠️ CRAFTING MODULE V8 SECRET RECIPES: Modulo caricato con successo!");
  ui.notifications.info("🛠️ Modulo Crafting Attivo!");

  game.craftingModule = {
    openJobSelectionDialog,
    openCraftingWorkbench
  };
});

Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
  const actor = app.actor || app.document;
  if (!actor) return;

  if (!buttons.some(b => b.class === "fvtt-crafting-header-btn")) {
    buttons.unshift({
      label: "Crafting",
      class: "fvtt-crafting-header-btn",
      icon: "fas fa-anvil",
      onclick: async () => {
        try {
          await openJobSelectionDialog(actor);
        } catch (err) {
          console.error("🛠️ CRAFTING MODULE Error:", err);
          ui.notifications.error("Errore nell'apertura del selettore di Mestiere.");
        }
      }
    });
  }
});

Hooks.on("renderActorSheet", (app, html) => safeInjectCraftingButton(app, html));
Hooks.on("renderActorSheetV2", (app, html) => safeInjectCraftingButton(app, html));
Hooks.on("renderActorSheet5eCharacter", (app, html) => safeInjectCraftingButton(app, html));
Hooks.on("renderActorSheet5eCharacter2", (app, html) => safeInjectCraftingButton(app, html));

function safeInjectCraftingButton(app, html) {
  try {
    injectCraftingButton(app, html);
  } catch (err) {
    console.error("🛠️ CRAFTING MODULE Injection Error:", err);
  }
}

function injectCraftingButton(app, html) {
  const actor = app.actor || app.document;
  if (!actor) return;

  let root = app.element instanceof HTMLElement ? app.element : (html?.[0] || html);
  if (!root || !(root instanceof HTMLElement)) return;

  const doInject = () => {
    if (root.querySelector('.fvtt-crafting-floating-btn')) return;

    const header = root.querySelector('.window-header') || root.querySelector('header.sheet-header') || root.querySelector('.sheet-header');

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fvtt-crafting-floating-btn";
    btn.innerHTML = `<i class="fa-solid fa-anvil" style="color: #f59e0b;"></i> <span>Crafting</span>`;
    
    if (header) {
      btn.style.cssText = `
        position: absolute;
        right: 120px;
        top: 6px;
        z-index: 99;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #f59e0b;
        border: 1px solid #f59e0b;
        border-radius: 14px;
        padding: 2px 10px;
        font-size: 11px;
        font-weight: bold;
        font-family: 'Inter', sans-serif;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        transition: all 0.2s ease;
      `;
      header.appendChild(btn);
    } else {
      if (window.getComputedStyle(root).position === 'static') {
        root.style.position = 'relative';
      }
      btn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 70px;
        z-index: 99999;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #f59e0b;
        border: 1px solid #f59e0b;
        border-radius: 20px;
        padding: 4px 12px;
        font-size: 11px;
        font-weight: bold;
        font-family: 'Inter', sans-serif;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
        transition: all 0.2s ease;
      `;
      root.appendChild(btn);
    }

    btn.onmouseover = () => {
      btn.style.background = "#f59e0b";
      btn.style.color = "#000000";
      const icon = btn.querySelector("i");
      if (icon) icon.style.color = "#000000";
      btn.style.transform = "translateY(-1px) scale(1.05)";
    };

    btn.onmouseout = () => {
      btn.style.background = "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
      btn.style.color = "#f59e0b";
      const icon = btn.querySelector("i");
      if (icon) icon.style.color = "#f59e0b";
      btn.style.transform = "translateY(0) scale(1)";
    };

    btn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await openJobSelectionDialog(actor);
      } catch (err) {
        console.error("🛠️ CRAFTING MODULE Error:", err);
        ui.notifications.error("Errore nell'apertura del selettore di Mestiere.");
      }
    };
  };

  doInject();

  if (!root._craftingObserver) {
    const observer = new MutationObserver(() => {
      if (!root.querySelector('.fvtt-crafting-floating-btn')) {
        doInject();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    root._craftingObserver = observer;
  }
}

function normalizeWeaponRarity(value) {
  // D&D5e lascia spesso vuota la rarità degli oggetti mondani: per il sistema
  // Forature/Gemme questi oggetti sono Common, come già faceva il Weapon System.
  let source = value;
  if (source && typeof source === 'object') {
    source = source.value ?? source.id ?? source.key ?? '';
  }
  const raw = String(source ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (!raw || raw === 'none' || raw === 'mundane') return 'common';
  const aliases = {
    common: 'common',
    uncommon: 'uncommon',
    rare: 'rare',
    veryrare: 'veryRare',
    legendary: 'legendary',
    artifact: 'artifact'
  };
  return aliases[raw] || raw;
}

function getWeaponItemRarity(weaponItem) {
  if (!weaponItem) return 'common';
  const raw = weaponItem.system?.rarity
    ?? weaponItem.flags?.['foundry-weapon-system']?.rarity
    ?? weaponItem.flags?.['foundry-weapon-system']?.weaponRarity
    ?? '';
  return normalizeWeaponRarity(raw);
}

function getWeaponRarityLabel(value) {
  const rarity = normalizeWeaponRarity(value);
  const labels = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    veryRare: 'Very Rare',
    legendary: 'Legendary',
    artifact: 'Artifact'
  };
  return labels[rarity] || 'Common';
}

function weaponMatchesRecipeRarity(recipe, weaponItem) {
  // Compatibilità con le vecchie ricette: se non avevano ancora il campo rarità,
  // continuano a funzionare. Le armi mondane con rarity vuota valgono Common.
  if (!recipe?.weaponRarity) return true;
  return getWeaponItemRarity(weaponItem) === normalizeWeaponRarity(recipe.weaponRarity);
}

function getRecipeDefaultIcon(recipe, selectedWeapon = null) {
  const type = recipe.type || (recipe.isRepair ? 'repair' : (recipe.isCoating ? 'coating' : 'std'));

  // Foratura e Rimozione non usano più le vecchie SVG: quando c'è un'arma nello Slot 1
  // l'anteprima è esattamente l'immagine di quell'arma.
  if (type === 'weapon_gem' || recipe.isWeaponGem) {
    const action = getWeaponGemActiveAction(recipe);
    if ((action === 'drill' || action === 'remove') && selectedWeapon?.img) {
      return selectedWeapon.img;
    }
    if (action === 'insert' && recipe.ing2Img && recipe.ing2Img !== "icons/svg/item-bag.svg") {
      return recipe.ing2Img;
    }
    if (recipe.resultImg && recipe.resultImg !== "icons/svg/item-bag.svg" && !['icons/svg/anvil.svg','icons/svg/repair.svg','icons/svg/upgrade.svg'].includes(recipe.resultImg)) {
      return recipe.resultImg;
    }
    return "icons/svg/sword.svg";
  }

  if (recipe.resultImg && recipe.resultImg !== "icons/svg/item-bag.svg") {
    return recipe.resultImg;
  }
  if (type === 'repair' || recipe.isRepair) {
    return "icons/svg/repair.svg";
  }
  if (type === 'coating' || recipe.isCoating) {
    return "icons/svg/upgrade.svg";
  }
  return "icons/svg/anvil.svg";
}

function isWeaponGemRecipe(recipe) {
  return !!(recipe && (recipe.type === 'weapon_gem' || recipe.isWeaponGem));
}

function getWeaponGemActionLabel(action) {
  if (action === 'insert') return 'Incastonatura';
  if (action === 'remove') return 'Rimozione Gemma';
  return 'Foratura';
}

function getWeaponGemActionIcon(action) {
  if (action === 'insert') return 'fa-gem';
  if (action === 'remove') return 'fa-hand-sparkles';
  return 'fa-screwdriver-wrench';
}

function getWeaponGemPreviewImage(action) {
  // Fallback sicuro. Nel banco Foratura/Rimozione l'immagine viene sostituita
  // dinamicamente con quella dell'arma realmente inserita nello Slot 1.
  return 'icons/svg/sword.svg';
}

function getWeaponGemSlotIndex(recipe) {
  const action = getWeaponGemActiveAction(recipe);
  if (action === 'drill') return -1;
  const raw = parseInt(recipe?.targetGemSlot ?? recipe?.weaponGemTargetSlot ?? 1, 10);
  const slot = Number.isFinite(raw) ? raw : 1;
  return Math.clamp(slot - 1, 0, 2);
}

function getWeaponGemActiveAction(recipe) {
  return (recipe?.weaponGemAction || recipe?.gemAction || 'drill').toLowerCase();
}

function isGenericWeaponRequirement(name) {
  if (!name) return true;
  const n = String(name).trim().toLowerCase();
  return ['arma realistica', 'qualsiasi arma', 'qualsiasi arma realistica', 'realistic weapon', 'weapon'].includes(n);
}

async function addGemFragmentsToActor(actor, qty = 1) {
  if (!actor || qty <= 0) return;
  const pack = game.packs.get('craftingsystem.Oggetti');
  if (!pack) return;
  try {
    const index = await pack.getIndex();
    const gemFolder = pack.folders.find(f => f.name.toLowerCase() === 'gemme');
    const fragmentsInfo = index.find(i => (!gemFolder || i.folder === gemFolder.id) && i.name.toLowerCase().trim() === 'frammenti di gemma');
    if (!fragmentsInfo) return;
    const fragmentDoc = await pack.getDocument(fragmentsInfo._id);
    if (!fragmentDoc) return;
    const existing = actor.items.find(i => i.name.toLowerCase().trim() === 'frammenti di gemma');
    if (existing) {
      await existing.update({ 'system.quantity': (existing.system?.quantity || 1) + qty });
    } else {
      const data = fragmentDoc.toObject();
      data.system = data.system || {};
      data.system.quantity = qty;
      await actor.createEmbeddedDocuments('Item', [data]);
    }
  } catch (err) {
    console.error('🛠️ CRAFTING MODULE: errore nell’aggiunta dei frammenti di gemma', err);
  }
}

function getWeaponGemFailurePenalty(lostCount) {
  if (lostCount <= 1) return 20;
  if (lostCount === 2) return 50;
  return 80;
}

function getDrillSuccessRate(slotIdx, weaponItem) {
  const rarity = (weaponItem?.system?.rarity || "").toLowerCase();
  let tier = "common";
  if (rarity.includes("legendary") || rarity.includes("artifact")) tier = "legendary";
  else if (rarity.includes("rare") || rarity.includes("very")) tier = "rare";

  if (tier === "legendary") {
    if (slotIdx === 0) return 10;
    if (slotIdx === 1) return 5;
    if (slotIdx === 2) return 0;
  } else if (tier === "rare") {
    if (slotIdx === 0) return 40;
    if (slotIdx === 1) return 30;
    if (slotIdx === 2) return 20;
  } else {
    if (slotIdx === 0) return 60;
    if (slotIdx === 1) return 50;
    if (slotIdx === 2) return 40;
  }
  return 50;
}

function getRecipeType(recipe) {
  if (!recipe) return 'std';
  if (recipe.type) return recipe.type;
  if (recipe.isRepair) return 'repair';
  if (recipe.isCoating) return 'coating';
  if (recipe.isWeaponGem) return 'weapon_gem';
  if (recipe.darkReagents?.length > 0 || recipe.darkReagent) return 'dark_art';
  if (recipe.arcanes?.length > 0) return 'mst';
  if (recipe.catalysts?.length > 0 || recipe.ing3) return 'pro';
  if (recipe.reagents?.length > 0) return 'adv';
  return 'std';
}

function getWeaponGemPreviewText(recipe) {
  const action = getWeaponGemActiveAction(recipe);
  const target = recipe?.ing2 || 'Oggetto Specifico';
  const rarityText = recipe?.weaponRarity ? ` | ${getWeaponRarityLabel(recipe.weaponRarity)}` : '';
  if (action === 'drill') return `${getWeaponGemActionLabel(action)} Auto | ${target}${rarityText}`;
  const slot = getWeaponGemSlotIndex(recipe) + 1;
  return `${getWeaponGemActionLabel(action)} Slot ${slot} | ${target}${rarityText}`;
}

function calculateDynamicSuccessRate(recipe, actor, selectedSlots, selectedQty, reagentSlots, reagentQty, catalystSlots, catalystQty, arcaneSlots, arcaneQty, darkSlots, darkQty, toolSlots) {
  if (!recipe) return 100;
  // Le ricette Forature/Gemme usano lo stesso calcolo di successo del crafting normale:
  // Base Successo + bonus configurati + cap massimo. Nessuna tabella manuale separata.
  if (recipe.type === 'repair' || recipe.isRepair || recipe.type === 'coating' || recipe.isCoating) return 100;

  const baseRate = recipe.baseSuccessRate !== undefined ? recipe.baseSuccessRate : (recipe.successRate !== undefined ? recipe.successRate : 100);
  const bonusExtraMain = recipe.bonusPerExtraMain || recipe.bonusPerExtraQty || 0;
  const bonusReagent = recipe.bonusPerExtraReagent || recipe.bonusPerReagent || 0;
  const bonusCatalyst = recipe.bonusPerExtraCatalyst || 0;
  const bonusArcane = recipe.bonusPerExtraArcane || 0;
  const bonusDark = recipe.bonusPerExtraDark || 0;
  const bonusTool = recipe.bonusPerTool || 0;
  const maxCap = recipe.maxSuccessRate || 100;

  let currentRate = baseRate;

  if (bonusExtraMain > 0) {
    let extraUnits = 0;
    [0, 1, 2].forEach(sIdx => {
      const item = selectedSlots[sIdx];
      if (item) {
        let reqQty = 1;
        if (sIdx === 0) reqQty = recipe.qty1 || 1;
        else if (sIdx === 1) reqQty = recipe.qty2 || 1;
        else if (sIdx === 2) reqQty = recipe.qty3 || 1;

        const currentQty = selectedQty[sIdx] || reqQty;
        if (currentQty > reqQty) {
          extraUnits += (currentQty - reqQty);
        }
      }
    });
    currentRate += (extraUnits * bonusExtraMain);
  }

  if (bonusReagent > 0) {
    reagentSlots.forEach((r, idx) => {
      if (r !== null) {
        let reqQty = 1;
        if (recipe.reagents && recipe.reagents[idx]) {
          reqQty = typeof recipe.reagents[idx] === 'string' ? 1 : (recipe.reagents[idx].qty || 1);
        }
        const currentQty = reagentQty[idx] || reqQty;
        if (currentQty > reqQty) {
          currentRate += ((currentQty - reqQty) * bonusReagent);
        }
      }
    });
  }

  if (bonusCatalyst > 0) {
    catalystSlots.forEach((c, idx) => {
      if (c !== null) {
        let reqQty = 1;
        if (recipe.catalysts && recipe.catalysts[idx]) {
          reqQty = typeof recipe.catalysts[idx] === 'string' ? 1 : (recipe.catalysts[idx].qty || 1);
        }
        const currentQty = catalystQty[idx] || reqQty;
        if (currentQty > reqQty) {
          currentRate += ((currentQty - reqQty) * bonusCatalyst);
        }
      }
    });
  }

  if (bonusArcane > 0) {
    arcaneSlots.forEach((a, idx) => {
      if (a !== null) {
        let reqQty = 1;
        if (recipe.arcanes && recipe.arcanes[idx]) {
          reqQty = typeof recipe.arcanes[idx] === 'string' ? 1 : (recipe.arcanes[idx].qty || 1);
        }
        const currentQty = arcaneQty[idx] || reqQty;
        if (currentQty > reqQty) {
          currentRate += ((currentQty - reqQty) * bonusArcane);
        }
      }
    });
  }

  if (bonusDark > 0) {
    darkSlots.forEach((d, idx) => {
      if (d !== null) {
        let reqQty = 1;
        const darkList = recipe.darkReagents || (recipe.darkReagent ? [recipe.darkReagent] : []);
        if (darkList[idx]) {
          reqQty = typeof darkList[idx] === 'string' ? 1 : (darkList[idx].qty || 1);
        }
        const currentQty = darkQty[idx] || reqQty;
        if (currentQty > reqQty) {
          currentRate += ((currentQty - reqQty) * bonusDark);
        }
      }
    });
  }

  if (bonusTool > 0) {
    let filledTools = 0;
    toolSlots.forEach(sList => {
      sList.forEach(t => {
        if (t !== null) filledTools++;
      });
    });
    currentRate += (filledTools * bonusTool);
  }

  return Math.clamp(currentRate, 1, maxCap);
}

function injectCraftingCSS() {
  if (document.getElementById("fvtt-crafting-styles")) return;
  const style = document.createElement("style");
  style.id = "fvtt-crafting-styles";
  style.textContent = `
    .fvtt-craft-window {
      font-family: 'Inter', system-ui, sans-serif !important;
      color: #f3f4f6 !important;
      background: #0f172a !important;
      padding: 16px;
      border-radius: 12px;
      font-size: 13px;
      max-height: 88vh !important;
      overflow-y: auto !important;
    }
    .fvtt-craft-window::-webkit-scrollbar, .fvtt-panel::-webkit-scrollbar, #fvtt-inv-list::-webkit-scrollbar, #fvtt-comp-list::-webkit-scrollbar, #fvtt-recipes-grid::-webkit-scrollbar { width: 6px !important; height: 6px !important; }
    .fvtt-craft-window::-webkit-scrollbar-track, .fvtt-panel::-webkit-scrollbar-track, #fvtt-inv-list::-webkit-scrollbar-track, #fvtt-comp-list::-webkit-scrollbar-track, #fvtt-recipes-grid::-webkit-scrollbar-track { background: #020617 !important; border-radius: 4px !important; }
    .fvtt-craft-window::-webkit-scrollbar-thumb, .fvtt-panel::-webkit-scrollbar-thumb, #fvtt-inv-list::-webkit-scrollbar-thumb, #fvtt-comp-list::-webkit-scrollbar-thumb, #fvtt-recipes-grid::-webkit-scrollbar-thumb { background: #334155 !important; border-radius: 4px !important; }
    .fvtt-craft-window::-webkit-scrollbar-thumb:hover, .fvtt-panel::-webkit-scrollbar-thumb:hover, #fvtt-inv-list::-webkit-scrollbar-thumb:hover, #fvtt-comp-list::-webkit-scrollbar-thumb:hover, #fvtt-recipes-grid::-webkit-scrollbar-thumb:hover { background: #f59e0b !important; }
    .fvtt-panel { background: #1e293b !important; border: 1px solid #334155 !important; border-radius: 10px; padding: 12px; max-height: 480px !important; overflow-y: auto !important; }
    .fvtt-item-card { background: #0f172a !important; border: 1px solid #334155 !important; border-radius: 8px; padding: 8px 10px; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); position: relative; }
    .fvtt-item-card:hover { border-color: #f59e0b !important; background: #1e293b !important; transform: translateY(-3px) scale(1.02); box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4); z-index: 10; }
    .fvtt-tool-slot { width: 26px !important; height: 26px !important; background: #020617 !important; border: 1.5px dashed #f59e0b !important; border-radius: 6px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; transition: all 0.15s ease !important; font-size: 10px !important; color: #f59e0b !important; position: relative !important; }
    .fvtt-tool-slot:hover { border-style: solid !important; background: rgba(245, 158, 11, 0.2) !important; transform: scale(1.1) !important; box-shadow: 0 0 8px rgba(245, 158, 11, 0.5) !important; }
    .fvtt-tool-slot.filled { border-style: solid !important; border-color: #10b981 !important; background: rgba(16, 185, 129, 0.18) !important; }
    .fvtt-main-slot { width: 72px !important; height: 72px !important; background: #0b0d10 !important; border: 1.5px solid #4b5563 !important; border-radius: 12px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; transition: all 0.2s ease-in-out !important; position: relative !important; cursor: pointer !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }
    .fvtt-main-slot:hover { border-color: #f59e0b !important; background: rgba(245, 158, 11, 0.15) !important; transform: translateY(-2px) scale(1.05) !important; box-shadow: 0 6px 18px rgba(245, 158, 11, 0.5), 0 0 12px rgba(245, 158, 11, 0.3) !important; }
    .fvtt-main-slot.filled { border-color: #f59e0b !important; background: rgba(245, 158, 11, 0.12) !important; }
    .fvtt-slot-res { width: 72px !important; height: 72px !important; background: #020617 !important; border: 2px solid #f59e0b !important; border-radius: 12px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; position: relative !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; cursor: pointer !important; }
    .fvtt-reagent-slot { width: 58px !important; height: 58px !important; background: #0b0d10 !important; border: 1.5px solid #4b5563 !important; border-radius: 12px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; transition: all 0.2s ease-in-out !important; cursor: pointer !important; position: relative !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }
    .fvtt-reagent-slot:hover { border-color: #3b82f6 !important; background: rgba(59, 130, 246, 0.2) !important; transform: translateY(-2px) scale(1.05) !important; box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5) !important; }
    .fvtt-reagent-slot.filled { border-color: #3b82f6 !important; background: rgba(59, 130, 246, 0.15) !important; }
    .fvtt-catalyst-slot { width: 58px !important; height: 58px !important; background: #0b0d10 !important; border: 1.5px solid #a855f7 !important; border-radius: 12px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; transition: all 0.2s ease-in-out !important; cursor: pointer !important; position: relative !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }
    .fvtt-catalyst-slot:hover { border-color: #c084fc !important; background: rgba(168, 85, 247, 0.25) !important; transform: translateY(-2px) scale(1.05) !important; box-shadow: 0 6px 16px rgba(168, 85, 247, 0.6) !important; }
    .fvtt-catalyst-slot.filled { border-color: #c084fc !important; background: rgba(168, 85, 247, 0.18) !important; }
    .fvtt-arcane-slot { width: 58px !important; height: 58px !important; background: #032b38 !important; border: 1.5px solid #06b6d4 !important; border-radius: 12px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; transition: all 0.2s ease-in-out !important; cursor: pointer !important; position: relative !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }
    .fvtt-arcane-slot:hover { border-color: #67e8f9 !important; background: rgba(6, 182, 212, 0.3) !important; transform: translateY(-2px) scale(1.05) !important; box-shadow: 0 6px 16px rgba(6, 182, 212, 0.7) !important; }
    .fvtt-arcane-slot.filled { border-color: #67e8f9 !important; background: rgba(6, 182, 212, 0.2) !important; }
    .fvtt-dark-slot { width: 58px !important; height: 58px !important; background: #2a081a !important; border: 1.5px solid #f43f5e !important; border-radius: 12px !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; transition: all 0.2s ease-in-out !important; cursor: pointer !important; position: relative !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }
    .fvtt-dark-slot:hover { border-color: #fb7185 !important; background: rgba(244, 63, 94, 0.3) !important; transform: translateY(-2px) scale(1.05) !important; box-shadow: 0 6px 16px rgba(244, 63, 94, 0.7) !important; }
    .fvtt-dark-slot.filled { border-color: #fb7185 !important; background: rgba(244, 63, 94, 0.2) !important; }
    .recipe-drop-slot { width: 100% !important; min-height: 48px !important; background: #020617 !important; border: 1.5px dashed #f59e0b !important; border-radius: 8px !important; display: flex !important; align-items: center !important; justify-content: flex-start !important; gap: 10px !important; cursor: pointer !important; margin-bottom: 6px !important; padding: 6px 12px !important; transition: all 0.2s ease !important; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5) !important; }
    .recipe-drop-slot:hover { border-style: solid !important; border-color: #fbbf24 !important; background: rgba(245, 158, 11, 0.15) !important; transform: translateY(-1px) !important; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3) !important; }
    .recipe-drop-slot.filled { border-style: solid !important; border-color: #10b981 !important; background: rgba(16, 185, 129, 0.15) !important; }
    .recipe-reagent-drop-slot { width: 58px !important; height: 58px !important; background: #0b0d10 !important; border: 1.5px solid #3b82f6 !important; border-radius: 12px !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: pointer !important; transition: all 0.2s ease-in-out !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; position: relative !important; }
    .recipe-reagent-drop-slot:hover { border-color: #60a5fa !important; background: rgba(59, 130, 246, 0.2) !important; transform: translateY(-2px) scale(1.05) !important; box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5) !important; }
    .recipe-reagent-drop-slot.filled { border-style: solid !important; border-color: #38bdf8 !important; background: rgba(56, 189, 248, 0.18) !important; }
    .fvtt-main-slot.drag-over, .fvtt-reagent-slot.drag-over, .fvtt-catalyst-slot.drag-over, .fvtt-arcane-slot.drag-over, .fvtt-dark-slot.drag-over, .fvtt-tool-slot.drag-over, .recipe-drop-slot.drag-over, .recipe-reagent-drop-slot.drag-over { border-color: #fbbf24 !important; background: rgba(251, 191, 36, 0.25) !important; box-shadow: 0 0 25px rgba(251, 191, 36, 0.9) !important; transform: scale(1.04) !important; }
    .fvtt-btn { background: linear-gradient(180deg, #d97706 0%, #b45309 100%) !important; color: #ffffff !important; font-weight: bold; font-size: 11px; border-radius: 8px; padding: 6px 12px; cursor: pointer; border: 1px solid #fef3c7 !important; box-shadow: 0 3px 6px rgba(0,0,0,0.3); transition: all 0.15s ease; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
    .fvtt-btn:hover:not(:disabled) { filter: brightness(1.2); transform: translateY(-2px); box-shadow: 0 6px 14px rgba(245, 158, 11, 0.4); }
    .fvtt-btn.active { box-shadow: inset 0 2px 4px rgba(0,0,0,0.6), 0 0 8px rgba(245, 158, 11, 0.6) !important; filter: brightness(1.25) !important; }
    .fvtt-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
    .fvtt-input { background: #020617 !important; color: #f3f4f6 !important; border: 1px solid #334155 !important; border-radius: 6px; padding: 6px 10px; font-size: 12px; }
    .qty-status-ok { color: #10b981; font-weight: bold; }
    .qty-status-err { color: #ef4444; font-weight: bold; }
    .recipe-drop-slot.disabled { opacity: 0.6; cursor: not-allowed; pointer-events: none; border-color: #475569; }
  `;
  document.head.appendChild(style);
}

async function renderUniversalDialog({ title, content, renderCB, width = 840, height = 680 }) {
  const safeRenderCB = typeof renderCB === "function" ? renderCB : () => {};

  if (foundry?.applications?.api?.DialogV2) {
    try {
      const dialog = new foundry.applications.api.DialogV2({
        window: { title: title, resizable: true },
        content: content,
        buttons: [
          {
            action: "close",
            label: "Chiudi",
            default: false
          }
        ]
      });

      await dialog.render(true);
      setTimeout(() => {
        const el = dialog.element;
        if (el) safeRenderCB(el, dialog);
      }, 50);

      return dialog;
    } catch (e) {
      console.warn("🛠️ CRAFTING MODULE: Fallback a Dialog V1", e);
    }
  }

  const dialog = new Dialog({
    title: title,
    content: content,
    buttons: {},
    render: (html) => {
      const root = html instanceof HTMLElement ? html : (html?.[0] || html);
      if (root) safeRenderCB(root, dialog);
    }
  }, { width: width, height: height, resizable: true });

  dialog.render(true);
  return dialog;
}

function getActorItemQuantity(actor, itemName) {
  if (!actor || !itemName) return 0;
  const lower = itemName.toLowerCase().trim();
  return actor.items
    .filter(i => i.name.toLowerCase().trim() === lower)
    .reduce((total, item) => total + (item.system?.quantity ?? 1), 0);
}

async function consumeActorItemQuantity(actor, itemName, requiredQty) {
  if (!actor || !itemName || requiredQty <= 0) return;
  const lower = itemName.toLowerCase().trim();
  const matchingItems = actor.items.filter(i => i.name.toLowerCase().trim() === lower);

  let remaining = requiredQty;

  for (const item of matchingItems) {
    if (remaining <= 0) break;
    const currentQty = item.system?.quantity ?? 1;

    if (currentQty <= remaining) {
      remaining -= currentQty;
      await item.delete();
    } else {
      const newQty = currentQty - remaining;
      remaining = 0;
      await item.update({ "system.quantity": newQty });
    }
  }
}

function getActorStat(actor, statKey) {
  if (!actor || !actor.system || !actor.system.abilities) return 0;
  const ab = actor.system.abilities;
  
  const aliases = {
    str: ["str", "forza", "for"],
    con: ["con", "costituzione", "costitution"],
    int: ["int", "intelligenza"]
  };

  const keysToCheck = aliases[statKey] || [statKey];
  for (const k of keysToCheck) {
    if (ab[k] && typeof ab[k].value === "number") return ab[k].value;
  }
  return 0;
}

function getToolSlotCountsByLevel(level) {
  if (level < 2) return [0, 0, 0];
  if (level <= 3) return [1, 0, 0];
  if (level <= 6) return [1, 1, 0];
  if (level <= 8) return [2, 1, 0];
  if (level === 9) return [2, 2, 2];
  return [3, 2, 1];
}

// Requisiti fissi dei tipi di crafting per i Job Speciali.
// Il livello del job speciale equivale al numero di stelle possedute.
function getSpecialCraftingStarRequirement(mode) {
  const requirements = { std: 1, adv: 2, pro: 3, mst: 5 };
  return requirements[mode] || null;
}

function isSpecialFullCraftingMode(mode) {
  return ['std', 'adv', 'pro', 'mst', 'dark_art'].includes(mode);
}

async function openJobSelectionDialog(actor) {
  if (!actor) {
    ui.notifications.error("Nessun personaggio associato trovato.");
    return;
  }

  if (!document.getElementById("fvtt-crafting-fa")) {
    const link = document.createElement("link");
    link.id = "fvtt-crafting-fa";
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(link);
  }

  injectCraftingCSS();

  const jobs = [
    { id: "fabbro", name: "Fabbro", icon: "fa-hammer", desc: "Forgia armi, armature e metalli preziosi. (Req: 10 STR, 10 CON)", color: "#f59e0b" },
    { id: "alchimista", name: "Alchimista", icon: "fa-flask-vial", desc: "Mixa pozioni, reagenti ed elisir arcani.", color: "#38bdf8" }
  ];

  const getJobPreviewStats = async (jId) => {
    const stats = await actor.getFlag("world", `craftingStats_${jId}`) || { level: 1, exp: 0, prestige: 0 };
    return stats;
  };

  let jobCardsHtml = "";
  for (const j of jobs) {
    const st = await getJobPreviewStats(j.id);
    jobCardsHtml += `
      <div class="fvtt-job-card" data-job="${j.id}" style="background:#1e293b; border:2px solid #334155; border-radius:10px; padding:16px 10px; text-align:center; cursor:pointer; transition:all 0.2s;">
        <i class="fa-solid ${j.icon}" style="font-size:32px; color:${j.color}; margin-bottom:8px;"></i>
        <div style="font-weight:bold; font-size:15px; color:#f3f4f6; margin-bottom:2px;">${j.name}</div>
        <div style="font-size:10px; color:#38bdf8; font-weight:bold; margin-bottom:4px;">Livello ${st.level} | ⭐ ${st.prestige || 0} Prestige</div>
        <div style="font-size:11px; color:#94a3b8; line-height:1.3;">${j.desc}</div>
      </div>
    `;
  }

  const htmlContent = `
    <div style="padding:16px; background:#0f172a; color:#f3f4f6; font-family:'Inter', sans-serif; display:flex; flex-direction:column; gap:12px; border-radius:12px;">
      <h3 style="margin:0 0 4px 0; font-size:16px; color:#f59e0b; text-align:center; display:flex; align-items:center; justify-content:center; gap:8px;">
        <i class="fa-solid fa-briefcase"></i> Scegli il Mestiere: ${actor.name}
      </h3>
      <p style="margin:0 0 10px 0; font-size:11px; color:#94a3b8; text-align:center;">Ogni mestiere ha il suo livello, ricettario ed esperienza indipendenti.</p>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        ${jobCardsHtml}
      </div>
    </div>
    <style>
      .fvtt-job-card:hover { border-color: #f59e0b !important; transform: translateY(-3px); background: #27354f !important; box-shadow: 0 6px 16px rgba(245,158,11,0.3); }
    </style>
  `;

  renderUniversalDialog({
    title: `Scegli Mestiere - ${actor.name}`,
    content: htmlContent,
    width: 480,
    height: 320,
    renderCB: (root, dialogInst) => {
      root.querySelectorAll('.fvtt-job-card').forEach(card => {
        card.onclick = async () => {
          const jobId = card.getAttribute('data-job');
          const jobTitle = jobId === 'fabbro' ? 'Fabbro' : 'Alchimista';

          if (jobId === 'fabbro') {
            const str = getActorStat(actor, 'str');
            const con = getActorStat(actor, 'con');

            if (str < 10 || con < 10) {
              ui.notifications.warn(`⚠️ Requisiti insufficienti per accedere al Fabbro! Servono almeno 10 in Forza (attuale: ${str}) e 10 in Costituzione (attuale: ${con}).`);
              return;
            }
          }

          if (dialogInst && typeof dialogInst.close === 'function') dialogInst.close();
          await openCraftingWorkbench(actor, jobId, jobTitle);
        };
      });
    }
  });
}

const LEVEL_THRESHOLDS = {
  1: { expReq: 0, prestigeReq: 0 },
  2: { expReq: 100, prestigeReq: 0 },
  3: { expReq: 300, prestigeReq: 0 },
  4: { expReq: 600, prestigeReq: 5 },
  5: { expReq: 800, prestigeReq: 0 },
  6: { expReq: 1000, prestigeReq: 0 },
  7: { expReq: 1500, prestigeReq: 10 },
  8: { expReq: 2000, prestigeReq: 0 },
  9: { expReq: 3000, prestigeReq: 0 },
  10: { expReq: 6000, prestigeReq: 50 }
};

async function getActorJobStats(actor, jobKey) {
  let stats = await actor.getFlag("world", `craftingStats_${jobKey}`);
  if (!stats) {
    stats = { level: 1, exp: 0, prestige: 0 };
    await actor.setFlag("world", `craftingStats_${jobKey}`, stats);
  }
  if (typeof stats.prestige !== 'number') stats.prestige = 0;
  return stats;
}

async function addActorJobExp(actor, jobKey, jobTitle, expGained, prestigeGained = 0) {
  let stats = await getActorJobStats(actor, jobKey);
  stats.prestige += (prestigeGained || 0);

  let targetExp = stats.exp + (expGained || 25);
  let leveledUp = false;

  while (stats.level < 10) {
    const nextLv = stats.level + 1;
    const req = LEVEL_THRESHOLDS[nextLv];
    if (!req) break;

    if (jobKey === 'fabbro' && nextLv >= 3) {
      const intVal = getActorStat(actor, 'int');
      if (intVal < 10) {
        if (targetExp >= req.expReq) targetExp = req.expReq;
        break;
      }
    }

    const hasExp = targetExp >= req.expReq;
    const hasPrestige = stats.prestige >= req.prestigeReq;

    if (hasExp && hasPrestige) {
      stats.level = nextLv;
      leveledUp = true;
    } else {
      if (hasExp && !hasPrestige) {
        targetExp = req.expReq;
      }
      break;
    }
  }

  stats.exp = targetExp;
  await actor.setFlag("world", `craftingStats_${jobKey}`, stats);

  if (leveledUp) {
    ui.notifications.info(`🎉 Congratulazioni! ${actor.name} è salito al Livello ${stats.level} in ${jobTitle}!`);
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `🎉 <b>${actor.name}</b> ha raggiunto il <b>Livello ${stats.level}</b> nella professione di <span style="color:#f59e0b;">${jobTitle}</span>!`
    });
  }
  return stats;
}


function isExtraSpecialJob(jobKey) {
  try {
    if (typeof window.extraJobsIsSpecialJob === "function" && window.extraJobsIsSpecialJob(jobKey)) return true;
  } catch (_) {}

  // Fallback indipendente dall'ordine di caricamento dei moduli.
  try {
    const saved = game?.settings?.get?.("extra-jobs", "jobsConfigJson");
    const cfg = saved?.[jobKey];
    if (cfg && (cfg.specialJob === true || cfg.progressionType === "prestige_only")) return true;
  } catch (_) {}

  // Default inclusi nel modulo Extra Jobs: evita che il layout speciale salti
  // se Foundry apre il banco nello stesso tick in cui le settings vengono inizializzate.
  return ["chimico_metallurgico", "forgiacristalli"].includes(String(jobKey || ""));
}

async function openCraftingWorkbench(actor, jobKey = 'fabbro', jobTitle = 'Fabbro') {
  if (!actor) {
    ui.notifications.error("Nessun personaggio associato trovato.");
    return;
  }

  if (jobKey === 'fabbro') {
    const str = getActorStat(actor, 'str');
    const con = getActorStat(actor, 'con');
    if (str < 10 || con < 10) {
      ui.notifications.warn(`⚠️ Requisiti insufficienti per il Fabbro: Servono almeno 10 Forza (ora: ${str}) e 10 Costituzione (ora: ${con})!`);
      return;
    }
  }

  if (!document.getElementById("fvtt-crafting-fa")) {
    const link = document.createElement("link");
    link.id = "fvtt-crafting-fa";
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(link);
  }

  injectCraftingCSS();

  const isGM = game.user.isGM;
  const hasDarkArt = getActorItemQuantity(actor, "Arte oscura") > 0 || getActorItemQuantity(actor, "Arti oscure") > 0;
  const jobStats = await getActorJobStats(actor, jobKey);
  // I job speciali sono gestiti dal modulo Extra Jobs e usano una UI crafting dedicata.
  const isSpecialJob = isExtraSpecialJob(jobKey);

  const itemPacks = game.packs.filter(p => p.documentName === "Item");
  const compendiumItems = [];
  
  let validCoatings = new Set();
  const objPack = game.packs.get("craftingsystem.Oggetti");
  if (objPack) {
    const index = await objPack.getIndex();
    const folder = objPack.folders.find(f => f.name.toLowerCase() === "rivestimento");
    if (folder) {
      index.forEach(i => {
        if (i.folder === folder.id) validCoatings.add(i.name.toLowerCase());
      });
    }
  }

  if (isGM) {
    for (const pack of itemPacks) {
      try {
        const index = await pack.getIndex({ fields: ["img", "type"] });
        index.forEach(item => {
          compendiumItems.push({
            id: item._id,
            uuid: `Compendium.${pack.collection}.Item.${item._id}`,
            name: item.name,
            img: item.img || "icons/svg/item-bag.svg",
            type: item.type,
            pack: pack.collection,
            packTitle: pack.metadata.label
          });
        });
      } catch (err) {
        console.warn(`Impossibile indicizzare il compendio: ${pack.collection}`, err);
      }
    }
  }

  const defaultRecipesByJob = {
    fabbro: [],
    alchimista: []
  };

  const flagName = `craftingRecipes_${jobKey}`;
  let recipes = (await actor.getFlag("world", flagName)) || defaultRecipesByJob[jobKey] || [];

  // Ogni ricetta deve avere un ID stabile: serve anche per ricordare le Ricette Segrete scoperte.
  if (Array.isArray(recipes)) {
    let assignedRecipeIds = false;
    for (const recipe of recipes) {
      if (!recipe?.id) {
        recipe.id = `r_${foundry.utils.randomID()}`;
        assignedRecipeIds = true;
      }
    }
    if (assignedRecipeIds) await actor.setFlag("world", flagName, recipes);
  }

  // Migrazione automatica: per i Job Speciali Standard/Avanzato/Professionale/Master
  // hanno requisiti fissi 1/2/3/5 stelle, anche per ricette create con versioni precedenti.
  if (isSpecialJob && Array.isArray(recipes)) {
    let normalized = false;
    for (const recipe of recipes) {
      const type = getRecipeType(recipe);
      const forcedStars = getSpecialCraftingStarRequirement(type);
      if (forcedStars && Number(recipe.requiredLevel || 1) !== forcedStars) {
        recipe.requiredLevel = forcedStars;
        normalized = true;
      }
      // I Job Speciali non usano EXP come ricompensa.
      if (Number(recipe.expReward || 0) !== 0) {
        recipe.expReward = 0;
        normalized = true;
      }
    }
    if (normalized) await actor.setFlag("world", flagName, recipes);
  }

  function getActorInventory() {
    return actor.items.map(i => ({
      id: i.id,
      uuid: i.uuid,
      name: i.name,
      quantity: i.system?.quantity ?? 1,
      img: i.img || "icons/svg/item-bag.svg",
      type: i.type,
      flags: i.flags
    }));
  }

  const currentLv = jobStats.level;
  const nextLv = Math.min(10, currentLv + 1);
  const currentExp = jobStats.exp;
  const nextReq = LEVEL_THRESHOLDS[nextLv];
  const nextExpReq = nextReq?.expReq || currentExp;
  const prevExpReq = LEVEL_THRESHOLDS[currentLv]?.expReq || 0;
  const expProgressPercent = currentLv >= 10 ? 100 : Math.min(100, Math.max(0, ((currentExp - prevExpReq) / (nextExpReq - prevExpReq)) * 100));

  const showSpecializations = currentLv >= 7;

  const dialogHtml = `
  <div class="fvtt-craft-window" id="fvtt-craft-root">
    
    <!-- BARRA SUPERIORE & LIVELLO -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <button type="button" id="fvtt-btn-back-jobs" class="fvtt-btn" style="background:#334155 !important; border-color:#475569 !important; padding:4px 8px;" title="Torna alla scelta mestiere"><i class="fa-solid fa-arrow-left"></i></button>
        <div>
          <h2 style="margin:0; font-size: 16px; color: #f59e0b; font-weight:bold; display:flex; align-items:center; gap: 8px;">
            <i class="fa-solid fa-anvil"></i> ${jobTitle}: ${actor.name}
          </h2>
          <div style="display:flex; align-items:center; gap:10px; margin-top:3px; flex-wrap:wrap;">
            <span id="fvtt-display-level" style="font-size:11px; color:#38bdf8; font-weight:bold;">Livello ${currentLv} / 10</span>
            <span id="fvtt-display-prestige" style="font-size:11px; color:#facc15; font-weight:bold;">⭐ Prestige: ${jobStats.prestige || 0}</span>
            
            ${isGM ? `<button type="button" id="fvtt-btn-gm-edit-stats" class="fvtt-btn" style="padding:1px 6px; font-size:9px; background:#475569 !important;" title="Modifica EXP/Livello"><i class="fa-solid fa-gear"></i> Modifica</button>` : ''}
          </div>
        </div>
      </div>

      <div style="display:flex; gap: 6px;">
        <button type="button" id="fvtt-tab-btn-bench" class="fvtt-btn active"><i class="fa-solid fa-hammer"></i> Banco</button>
        ${isGM ? `
          <button type="button" id="fvtt-tab-btn-compendium" class="fvtt-btn"><i class="fa-solid fa-box-open"></i> Compendii</button>
          <button type="button" id="fvtt-tab-btn-recipes" class="fvtt-btn"><i class="fa-solid fa-book"></i> Ricette</button>
        ` : ''}
      </div>
    </div>

    <!-- BARRA ESPERIENZA & AVVISI PRESTIGIO -->
    <div style="background:#020617; border:1px solid #334155; border-radius:8px; padding:6px 10px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; font-size:10px; color:#94a3b8; margin-bottom:4px;">
        <span>Esperienza (EXP) & Prestige</span>
        <span id="fvtt-exp-text"><b>${currentExp}</b> / ${currentLv >= 10 ? 'MAX' : nextExpReq + ' EXP'} (⭐ ${jobStats.prestige || 0} Prestige)</span>
      </div>
      <div style="width:100%; height:8px; background:#1e293b; border-radius:4px; overflow:hidden;">
        <div id="fvtt-exp-bar" style="width:${expProgressPercent}%; height:100%; background:linear-gradient(90deg, #38bdf8 0%, #3b82f6 100%); transition: width 0.3s ease;"></div>
      </div>
      <div id="fvtt-prestige-warning"></div>
    </div>

    <!-- VIEW 1: WORKBENCH -->
    <div id="fvtt-view-workbench" style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 12px;">
      <div class="fvtt-panel" style="max-height: 440px; overflow-y: auto;">
        <h4 style="margin:0 0 8px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight:bold;">📦 Inventario</h4>
        <input type="text" id="fvtt-inv-search" class="fvtt-input" placeholder="Cerca..." style="width:100%; margin-bottom: 8px;">
        <div id="fvtt-inv-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
      </div>

      <div id="fvtt-crafting-main-panel" class="fvtt-panel ${isSpecialJob ? 'extra-special-workbench-base' : ''}" data-special-job="${isSpecialJob ? 'true' : 'false'}" style="display: flex; flex-direction: column; justify-content: space-between; align-items: center; min-height: 420px; position: relative;">
        
        <div id="fvtt-crafting-controls-bar" style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            <button type="button" id="fvtt-subtab-std" class="fvtt-btn active" style="background: linear-gradient(180deg, #059669 0%, #047857 100%) !important; border-color:#34d399 !important;"><i class="fa-solid fa-cubes"></i> ${isSpecialJob ? 'Standard (⭐ 1+)' : 'Standard (Lv 1+)'}</button>
            <button type="button" id="fvtt-subtab-adv" class="fvtt-btn ${(isSpecialJob ? currentLv < 2 : currentLv < 4) ? 'opacity-40' : ''}" style="background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%) !important; border-color:#38bdf8 !important;" title="${isSpecialJob ? (currentLv < 2 ? 'Richiede 2 Stelle' : '') : (currentLv < 4 ? 'Richiede Livello 4 (5 ⭐ Prestige)' : '')}"><i class="fa-solid fa-flask-vial"></i> ${isSpecialJob ? 'Avanzato (⭐ 2+)' : 'Avanzato (Lv 4+)'}</button>
            <button type="button" id="fvtt-subtab-pro" class="fvtt-btn ${(isSpecialJob ? currentLv < 3 : currentLv < 7) ? 'opacity-40' : ''}" style="background: linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%) !important; border-color:#c084fc !important;" title="${isSpecialJob ? (currentLv < 3 ? 'Richiede 3 Stelle' : '') : (currentLv < 7 ? 'Richiede Livello 7 (10 ⭐ Prestige)' : '')}"><i class="fa-solid fa-crown"></i> ${isSpecialJob ? 'Professionale (⭐ 3+)' : 'Professionale (Lv 7+)'}</button>
            <button type="button" id="fvtt-subtab-mst" class="fvtt-btn ${(isSpecialJob ? currentLv < 5 : currentLv < 10) ? 'opacity-40' : ''}" style="background: linear-gradient(180deg, #ea580c 0%, #c2410c 100%) !important; border-color:#fb923c !important;" title="${isSpecialJob ? (currentLv < 5 ? 'Richiede 5 Stelle' : '') : (currentLv < 10 ? 'Richiede Livello 10 (50 ⭐ Prestige)' : '')}"><i class="fa-solid fa-wand-magic-sparkles"></i> ${isSpecialJob ? 'Master (⭐ 5)' : 'Master (Lv 10)'}</button>
            ${hasDarkArt ? `<button type="button" id="fvtt-subtab-dark" class="fvtt-btn" style="background: linear-gradient(180deg, #9f1239 0%, #881337 100%) !important; border-color:#f43f5e !important;"><i class="fa-solid fa-skull"></i> Arti oscure</button>` : ''}
            <button type="button" id="fvtt-subtab-coating" class="fvtt-btn" style="background: linear-gradient(180deg, #ca8a04 0%, #a16207 100%) !important; border-color:#facc15 !important;" title="Applica Rivestimenti (Lv 3+)"><i class="fa-solid fa-layer-group"></i> Rivestimenti</button>
            <button type="button" id="fvtt-subtab-gem" class="fvtt-btn" style="background: linear-gradient(180deg, #0f766e 0%, #115e59 100%) !important; border-color:#2dd4bf !important;" title="Forature, Incastonatura e Rimozione gemme"><i class="fa-solid fa-gem"></i> Forature & Gemme</button>
            <button type="button" id="fvtt-subtab-repair" class="fvtt-btn" style="background: linear-gradient(180deg, #475569 0%, #334155 100%) !important; border-color:#94a3b8 !important;" title="Riparazione Armi"><i class="fa-solid fa-wrench"></i> Riparazioni</button>
          </div>
          
          <div style="display: flex; gap: 4px; align-items:center;">
            <button type="button" id="fvtt-btn-quick-fill" class="fvtt-btn" style="background:#0284c7 !important; border-color:#38bdf8 !important;" title="Carica una ricetta salvata"><i class="fa-solid fa-wand-magic-sparkles"></i> Carica</button>
            <button type="button" id="fvtt-clear-slots" class="fvtt-btn" style="background:#ef4444 !important; border-color:#f87171 !important; padding: 4px 8px; font-size: 11px;"><i class="fa-solid fa-trash"></i> Svuota</button>
          </div>
        </div>

        <!-- SLOT PRINCIPALI CON STRUMENTI BASATI SUL LIVELLO -->
        <div id="fvtt-main-slots-row" style="display: flex; align-items: flex-end; gap: 10px; margin: 10px 0; justify-content: center; flex-wrap: wrap;">
          
          <!-- Container Slot 1 -->
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div id="fvtt-tools-slot-0" style="display: flex; gap: 4px; justify-content: center; margin-bottom: 4px; min-height: 28px;"></div>
            <div id="fvtt-slot-0" class="fvtt-main-slot">
              <i class="fa-solid fa-plus" style="font-size: 22px; color: #9ca3af;"></i>
            </div>
            <span id="fvtt-slot-0-lbl" style="font-size:11px; color: #94a3b8; display: block; margin-top: 4px; max-width:72px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Slot 1</span>
            <span id="fvtt-slot-0-qty" style="font-size:10px; display: block;"></span>
          </div>

          <span style="font-size: 18px; font-weight: bold; color: #64748b; margin-bottom: 25px;">+</span>

          <!-- Container Slot 2 -->
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div id="fvtt-tools-slot-1" style="display: flex; gap: 4px; justify-content: center; margin-bottom: 4px; min-height: 28px;"></div>
            <div id="fvtt-slot-1" class="fvtt-main-slot">
              <i class="fa-solid fa-plus" style="font-size: 22px; color: #9ca3af;"></i>
            </div>
            <span id="fvtt-slot-1-lbl" style="font-size:11px; color: #94a3b8; display: block; margin-top: 4px; max-width:72px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Slot 2</span>
            <span id="fvtt-slot-1-qty" style="font-size:10px; display: block;"></span>
          </div>

          <!-- Container Slot 3 -->
          <div id="fvtt-slot-2-container" style="display: ${isSpecialJob ? 'flex' : 'none'}; align-items: flex-end; gap: 10px;">
            <span style="font-size: 18px; font-weight: bold; color: #64748b; margin-bottom: 25px;">+</span>
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div id="fvtt-tools-slot-2" style="display: flex; gap: 4px; justify-content: center; margin-bottom: 4px; min-height: 28px;"></div>
              <div id="fvtt-slot-2" class="fvtt-main-slot" style="border-color:#a855f7 !important;">
                <i class="fa-solid fa-plus" style="font-size: 22px; color: #c084fc;"></i>
              </div>
              <span id="fvtt-slot-2-lbl" style="font-size:11px; color: #c084fc; font-weight:600; display: block; margin-top: 4px; max-width:72px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Slot 3</span>
              <span id="fvtt-slot-2-qty" style="font-size:10px; display: block;"></span>
            </div>
          </div>

          <span style="font-size: 22px; font-weight: bold; color: #f59e0b; margin-bottom: 25px;"><i class="fa-solid fa-arrow-right"></i></span>

          <!-- Container Risultato & Probabilità di Successo -->
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="min-height: 28px; margin-bottom: 4px;"></div>
            <div id="fvtt-slot-res" class="fvtt-slot-res" title="🖱️ Click DX: Apri la scheda dell'oggetto prodotto">
              <i class="fa-solid fa-question" style="font-size: 26px; color: #64748b;"></i>
            </div>
            <span id="fvtt-slot-res-lbl" style="font-size:11px; font-weight: bold; color: #f59e0b; display: block; margin-top: 4px; max-width:72px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">In attesa...</span>
            <div id="fvtt-success-rate-badge" style="margin-top:2px;"></div>
          </div>
        </div>

        <div id="fvtt-risk-warning-container" style="width:100%;"></div>

        <!-- REAGENTI MINORI -->
        <div id="fvtt-reagents-container" style="display: ${isSpecialJob ? 'block' : 'none'}; width: 100%; background: #020617; border: 1px solid #334155; border-radius: 10px; padding: 6px; margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: #38bdf8; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-flask"></i> Reagenti Minori (1 a 5):
          </div>
          <div style="display: flex; justify-content: space-around; align-items: center; gap: 4px;">
            ${[0,1,2,3,4].map(i => `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div id="fvtt-reagent-${i}" class="fvtt-reagent-slot">
                  <i class="fa-solid fa-flask" style="font-size: 16px; color: #38bdf8;"></i>
                </div>
                <span id="fvtt-reagent-${i}-lbl" style="font-size: 9px; color: #94a3b8; font-weight: 600; display: block; margin-top: 2px;">R${i+1}</span>
                <span id="fvtt-reagent-${i}-qty" style="font-size: 8px; display: block;"></span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- CATALIZZATORI -->
        <div id="fvtt-catalysts-container" style="display: ${isSpecialJob ? 'block' : 'none'}; width: 100%; background: #110e2e; border: 1px solid #6b21a8; border-radius: 10px; padding: 6px; margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: #c084fc; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-atom"></i> Catalizzatori Richiesti (Max ${isSpecialJob ? 3 : 2}):
          </div>
          <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
            ${(isSpecialJob ? [0,1,2] : [0,1]).map(i => `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div id="fvtt-catalyst-${i}" class="fvtt-catalyst-slot">
                  <i class="fa-solid fa-atom" style="font-size: 18px; color: #c084fc;"></i>
                </div>
                <span id="fvtt-catalyst-${i}-lbl" style="font-size: 9px; color: #d8b4fe; font-weight: 600; display: block; margin-top: 2px;">C${i+1}</span>
                <span id="fvtt-catalyst-${i}-qty" style="font-size: 8px; display: block;"></span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- ENERGIA ARCANA -->
        <div id="fvtt-arcane-container" style="display: ${isSpecialJob ? 'block' : 'none'}; width: 100%; background: #032330; border: 1px solid #0891b2; border-radius: 10px; padding: 6px; margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: #67e8f9; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-bolt-lightning"></i> Energia Arcana (Max ${isSpecialJob ? 1 : 2}):
          </div>
          <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
            ${[0,1].map(i => `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div id="fvtt-arcane-${i}" class="fvtt-arcane-slot">
                  <i class="fa-solid fa-bolt-lightning" style="font-size: 18px; color: #67e8f9;"></i>
                </div>
                <span id="fvtt-arcane-${i}-lbl" style="font-size: 9px; color: #a5f3fc; font-weight: 600; display: block; margin-top: 2px;">EA${i+1}</span>
                <span id="fvtt-arcane-${i}-qty" style="font-size: 8px; display: block;"></span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- MATERIALI OSCURI -->
        <div id="fvtt-dark-container" style="display: ${hasDarkArt ? 'block' : 'none'}; width: 100%; background: #200415; border: 1px solid #e11d48; border-radius: 10px; padding: 6px; margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: #fb7185; margin-bottom: 4px; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-skull"></i> Materiali Oscuri (1 a 5):
          </div>
          <div style="display: flex; justify-content: space-around; align-items: center; gap: 4px;">
            ${[0,1,2,3,4].map(i => `
              <div style="display: flex; flex-direction: column; align-items: center;">
                <div id="fvtt-dark-slot-${i}" class="fvtt-dark-slot">
                  <i class="fa-solid fa-skull" style="font-size: 16px; color: #fb7185;"></i>
                </div>
                <span id="fvtt-dark-slot-${i}-lbl" style="font-size: 9px; color: #fecdd3; font-weight: 600; display: block; margin-top: 2px;">D${i+1}</span>
                <span id="fvtt-dark-slot-${i}-qty" style="font-size: 8px; display: block;"></span>
              </div>
            `).join('')}
          </div>
        </div>

        <button type="button" id="fvtt-btn-do-craft" class="fvtt-btn" style="width: 100%; padding: 10px 16px; font-size: 13px;" disabled>
          <i class="fa-solid fa-hammer"></i> FABBRICA OGGETTO
        </button>
      </div>
    </div>

    <!-- VIEW 2: COMPENDIUM BROWSER (SOLO DM) -->
    ${isGM ? `
    <div id="fvtt-view-compendium" style="display: none; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <span style="font-size:11px; color:#94a3af;">🖱️ <b>Click SX</b>: Apri | 🖱️ <b>Click DX</b>: Crea Ricetta</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <select id="fvtt-comp-pack-filter" class="fvtt-input" type="button" style="max-width: 180px;">
            <option value="all">Tutti i Compendii</option>
            ${itemPacks.map(p => `<option value="${p.collection}">${p.metadata.label}</option>`).join('')}
          </select>
          <input type="text" id="fvtt-comp-search" class="fvtt-input" placeholder="Cerca..." style="width: 130px;">
        </div>
      </div>
      <div id="fvtt-comp-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 380px; overflow-y: auto;"></div>
    </div>
    ` : ''}

    <!-- VIEW 3: RECIPES (SOLO DM) -->
    ${isGM ? `
    <div id="fvtt-view-recipes" style="display: none; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
          <button type="button" id="fvtt-rec-filter-all" class="fvtt-btn active">Tutte</button>
          <select id="fvtt-rec-filter-level" class="fvtt-input" style="padding: 4px 8px; font-size: 11px;">
            <option value="all">${isSpecialJob ? 'Tutte le Stelle (1-5)' : 'Tutti i Livelli (1-10)'}</option>
            ${(isSpecialJob ? [1,2,3,4,5] : [1,2,3,4,5,6,7,8,9,10]).map(lvl => `<option value="${lvl}">${isSpecialJob ? '⭐'.repeat(lvl) + ' (' + lvl + ')' : 'Livello ' + lvl}</option>`).join('')}
          </select>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" id="fvtt-btn-export-json" class="fvtt-btn" style="background:#0284c7 !important; border-color:#38bdf8 !important;" title="Esporta Ricette Selezionate"><i class="fa-solid fa-download"></i> Esporta</button>
          <button type="button" id="fvtt-btn-import-json" class="fvtt-btn" style="background:#0d9488 !important; border-color:#2dd4bf !important;" title="Importa Ricette da JSON"><i class="fa-solid fa-upload"></i> Importa</button>
          <button type="button" id="fvtt-btn-add-recipe" class="fvtt-btn" style="background:#10b981 !important; border-color:#34d399 !important;">
            <i class="fa-solid fa-plus"></i> Nuova
          </button>
        </div>
      </div>
      <input type="file" id="fvtt-json-file-input" style="display: none;" accept=".json">
      <div id="fvtt-recipes-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 380px; overflow-y: auto;"></div>
    </div>
    ` : ''}

  </div>
  `;

  let selectedSlots = [null, null, null];
  let selectedQty = [1, 1, 1];
  let reagentSlots = [null, null, null, null, null];
  let reagentQty = [1, 1, 1, 1, 1];
  let catalystSlots = isSpecialJob ? [null, null, null] : [null, null];
  let catalystQty = isSpecialJob ? [1, 1, 1] : [1, 1];
  let arcaneSlots = [null, null];
  let arcaneQty = [1, 1];
  let darkSlots = [null, null, null, null, null];
  let darkQty = [1, 1, 1, 1, 1];
  let toolSlots = isSpecialJob ? [[null,null],[null,null],[null,null]] : [ [null, null, null], [null, null], [null] ];
  let activeCraftingMode = "std";
  let recipeFilter = "all";
  let recipeLevelFilter = "all";

  renderUniversalDialog({
    title: isSpecialJob ? `🛠️ Banco (${jobTitle}) - ${actor.name} (${'⭐'.repeat(Math.clamp(jobStats.level || 1, 1, 5))})` : `🛠️ Banco (${jobTitle}) - ${actor.name} (Lv. ${jobStats.level})`,
    content: dialogHtml,
    renderCB: (rootEl) => {
      attachCraftingWorkbenchLogic(rootEl, actor, recipes, compendiumItems, itemPacks, getActorInventory, selectedSlots, selectedQty, reagentSlots, reagentQty, catalystSlots, catalystQty, arcaneSlots, arcaneQty, darkSlots, darkQty, toolSlots, activeCraftingMode, recipeFilter, recipeLevelFilter, isGM, hasDarkArt, jobKey, jobTitle, flagName, jobStats, validCoatings, isSpecialJob);
    },
    width: 860,
    height: 700
  });
}

function attachCraftingWorkbenchLogic(root, actor, recipes, compendiumItems, itemPacks, getActorInventory, selectedSlots, selectedQty, reagentSlots, reagentQty, catalystSlots, catalystQty, arcaneSlots, arcaneQty, darkSlots, darkQty, toolSlots, activeCraftingMode, recipeFilter, recipeLevelFilter, isGM, hasDarkArt, jobKey, jobTitle, flagName, jobStats, validCoatings, resolvedIsSpecialJob = null) {
  // Usa la decisione presa prima del render: evita che listener e HTML vedano due stati diversi.
  const isSpecialJob = resolvedIsSpecialJob === null ? isExtraSpecialJob(jobKey) : !!resolvedIsSpecialJob;
  if (root) root.dataset.extraSpecialJob = isSpecialJob ? 'true' : 'false';

  // --- RICETTE SEGRETE ---
  // Queste funzioni devono vivere nello stesso scope di tutti i listener del banco
  // (Carica, riconoscimento ricetta, tentativo crafting, ecc.).
  // In V11 erano dentro openCraftingWorkbench(), quindi openQuickFillDialog()
  // non poteva vederle e generava ReferenceError.
  const secretDiscoveryFlagName = `craftingDiscoveredSecretRecipes_${jobKey}`;
  let discoveredSecretRecipeIds = new Set(actor.getFlag("world", secretDiscoveryFlagName) || []);
  let activeLoadedRecipeId = null;

  function isSecretRecipeDiscovered(recipe) {
    if (!recipe?.secret) return true;
    if (isGM) return true;
    return !!recipe.id && discoveredSecretRecipeIds.has(recipe.id);
  }

  function isUndiscoveredSecretRecipe(recipe) {
    return !!recipe?.secret && !isSecretRecipeDiscovered(recipe);
  }

  async function unlockSecretRecipeAfterSuccess(recipe) {
    // Il DM conosce già tutte le ricette. Una ricetta caricata dal ricettario
    // non può essere usata per "scoprirla" accidentalmente.
    if (!recipe?.secret || isGM || !recipe.id || discoveredSecretRecipeIds.has(recipe.id)) return false;
    if (activeLoadedRecipeId === recipe.id) return false;

    discoveredSecretRecipeIds.add(recipe.id);
    await actor.setFlag("world", secretDiscoveryFlagName, Array.from(discoveredSecretRecipeIds));

    const discoveredName = recipe.customName || recipe.result || "Ricetta Segreta";
    ui.notifications.info(`🔓 Ricetta Segreta scoperta: ${discoveredName}! Ora puoi vederla e caricarla dal ricettario.`);
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `🔓 <b>${actor.name}</b> ha scoperto una Ricetta Segreta di <b>${jobTitle}</b>: <b style="color:#facc15;">${discoveredName}</b>. Da ora è disponibile nel menu Carica.`
    });
    return true;
  }
  
  function updateExpBarUI() {
    const currentLv = jobStats.level;
    const nextLv = Math.min(10, currentLv + 1);
    const currentExp = jobStats.exp;
    const nextReq = LEVEL_THRESHOLDS[nextLv];
    const nextExpReq = nextReq?.expReq || currentExp;
    const nextPrestigeReq = nextReq?.prestigeReq || 0;
    const prevExpReq = LEVEL_THRESHOLDS[currentLv]?.expReq || 0;
    const expProgressPercent = currentLv >= 10 ? 100 : Math.min(100, Math.max(0, ((currentExp - prevExpReq) / (nextExpReq - prevExpReq)) * 100));

    const lvDisplay = root.querySelector('#fvtt-display-level');
    if (lvDisplay) lvDisplay.innerText = `Livello ${currentLv} / 10`;

    const prestigeDisplay = root.querySelector('#fvtt-display-prestige');
    if (prestigeDisplay) prestigeDisplay.innerText = `⭐ Prestige: ${jobStats.prestige || 0}`;

    const expText = root.querySelector('#fvtt-exp-text');
    if (expText) expText.innerHTML = `<b>${currentExp}</b> / ${currentLv >= 10 ? 'MAX' : nextExpReq + ' EXP'} (⭐ ${jobStats.prestige || 0} Prestige)`;

    const expBar = root.querySelector('#fvtt-exp-bar');
    if (expBar) expBar.style.width = `${expProgressPercent}%`;

    const warningContainer = root.querySelector('#fvtt-prestige-warning');
    if (warningContainer) {
      if (jobKey === 'fabbro' && currentLv === 2 && currentExp >= 300 && getActorStat(actor, 'int') < 10) {
        warningContainer.innerHTML = `<div style="color:#f87171; font-size:10px; font-weight:bold; margin-top:4px; background:rgba(239,68,68,0.1); padding:4px 8px; border-radius:4px; border:1px solid rgba(239,68,68,0.3); display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-brain"></i> Bloccato al Livello 2: Serve almeno <b>10 in Intelligenza</b> (attuale: ${getActorStat(actor, 'int')}) per avanzare al Livello 3!</div>`;
      } else if (currentLv < 10 && currentExp >= nextExpReq && (jobStats.prestige || 0) < nextPrestigeReq) {
        const missingPres = nextPrestigeReq - (jobStats.prestige || 0);
        warningContainer.innerHTML = `<div style="color:#f87171; font-size:10px; font-weight:bold; margin-top:4px; background:rgba(239,68,68,0.1); padding:4px 8px; border-radius:4px; border:1px solid rgba(239,68,68,0.3); display:flex; align-items:center; gap:6px;"><i class="fa-solid fa-triangle-exclamation"></i> Bloccato al Livello ${currentLv}: Mancano <b>${missingPres} ⭐ Prestige</b> per sbloccare il Livello ${nextLv}!</div>`;
      } else {
        warningContainer.innerHTML = "";
      }
    }
  }

  const backJobsBtn = root.querySelector('#fvtt-btn-back-jobs');
  if (backJobsBtn) {
    backJobsBtn.addEventListener('click', async (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      const parentDialog = root.closest('.window-app') || root.closest('[class*="dialog"]');
      if (parentDialog) {
        const closeBtn = parentDialog.querySelector('.header-button.close, [data-action="close"]');
        if (closeBtn) closeBtn.click();
      }
      await openJobSelectionDialog(actor);
    });
  }
  const gmEditBtn = root.querySelector('#fvtt-btn-gm-edit-stats');
  if (gmEditBtn) {
    gmEditBtn.addEventListener('click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      const editHtml = `
        <div style="padding:12px; background:#0f172a; color:#f3f4f6; display:flex; flex-direction:column; gap:8px;">
          <label style="font-size:11px; color:${isSpecialJob ? '#c084fc' : '#f59e0b'}; font-weight:bold;">${isSpecialJob ? 'Stelle / Livello (1-5):' : 'Modifica Livello (1-10):'}</label>
          <input type="number" id="gm-edit-lv" min="1" max="${isSpecialJob ? 5 : 10}" value="${Math.clamp(jobStats.level || 1, 1, isSpecialJob ? 5 : 10)}" class="fvtt-input">
          ${!isSpecialJob ? `
          <label style="font-size:11px; color:#38bdf8; font-weight:bold;">Esperienza (EXP):</label>
          <input type="number" id="gm-edit-exp" min="0" value="${jobStats.exp}" class="fvtt-input">
          ` : ''}
          <label style="font-size:11px; color:#facc15; font-weight:bold;">Punti Prestige:</label>
          <input type="number" id="gm-edit-prestige" min="0" value="${jobStats.prestige || 0}" class="fvtt-input">
          <button type="button" id="gm-save-stats" class="fvtt-btn" style="margin-top:8px;">Salva Modifiche</button>
        </div>
      `;
      renderUniversalDialog({
        title: `Gestione GM: ${jobTitle} (${actor.name})`,
        content: editHtml,
        width: 300,
        height: 310,
        renderCB: (gRoot, gDialog) => {
          gRoot.querySelector('#gm-save-stats').addEventListener('click', async () => {
            const newLv = parseInt(gRoot.querySelector('#gm-edit-lv').value) || 1;
            const newExp = isSpecialJob ? 0 : (parseInt(gRoot.querySelector('#gm-edit-exp')?.value) || 0);
            const newPres = parseInt(gRoot.querySelector('#gm-edit-prestige').value) || 0;
            jobStats.level = Math.clamp(newLv, 1, isSpecialJob ? 5 : 10);
            jobStats.exp = isSpecialJob ? 0 : Math.max(0, newExp);
            jobStats.prestige = Math.max(0, newPres);
            await actor.setFlag("world", `craftingStats_${jobKey}`, jobStats);
            ui.notifications.info("Statistiche aggiornate dal Master!");
            if (gDialog && gDialog.close) gDialog.close();
            const parentDialog = root.closest('.window-app') || root.closest('[class*="dialog"]');
            if (parentDialog) parentDialog.querySelector('.header-button.close, [data-action="close"]')?.click();
            await openCraftingWorkbench(actor, jobKey, jobTitle);
          });
        }
      });
    });
  }

  function renderToolSlots() {
    const counts = (isSpecialJob && isSpecialFullCraftingMode(activeCraftingMode))
      ? [2, 2, 2]
      : (activeCraftingMode === 'weapon_gem' ? [1, 1, 0] : getToolSlotCountsByLevel(jobStats.level));
    [0, 1, 2].forEach(sIdx => {
      const container = root.querySelector(`#fvtt-tools-slot-${sIdx}`);
      if (!container) return;
      container.innerHTML = "";
      const numTools = counts[sIdx];
      for (let tIdx = 0; tIdx < numTools; tIdx++) {
        const toolItem = toolSlots[sIdx][tIdx];
        const toolEl = document.createElement("div");
        toolEl.className = `fvtt-tool-slot ${toolItem ? 'filled' : ''}`;
        toolEl.title = toolItem ? `Strumento: ${toolItem.name} (Click per rimuovere)` : `Strumento Slot ${sIdx+1} - ${tIdx+1}`;
        if (toolItem) {
          toolEl.innerHTML = `<img src="${toolItem.img}" style="width:22px; height:22px; border-radius:4px; object-fit:cover;">`;
        } else {
          toolEl.innerHTML = `<i class="fa-solid fa-wrench"></i>`;
        }
        toolEl.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (toolSlots[sIdx][tIdx]) {
            toolSlots[sIdx][tIdx] = null;
            renderToolSlots();
            updateSlotsUI();
          } else {
            showInventoryPicker((item) => {
              toolSlots[sIdx][tIdx] = item;
              renderToolSlots();
              updateSlotsUI();
            });
          }
        };
        toolEl.ondragover = (e) => { e.preventDefault(); toolEl.classList.add('drag-over'); };
        toolEl.ondragleave = () => toolEl.classList.remove('drag-over');
        toolEl.ondrop = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          toolEl.classList.remove('drag-over');
          try {
            const rawData = e.dataTransfer.getData("text/plain");
            if (!rawData) return;
            const data = JSON.parse(rawData);
            let itemObj = null;
            if (data.uuid) {
              const doc = await fromUuid(data.uuid);
              if (doc) itemObj = { id: doc.id, name: doc.name, uuid: doc.uuid, img: doc.img, type: doc.type };
            } else if (data.name) {
              itemObj = { id: data.id, name: data.name, uuid: null, img: data.img || "icons/svg/item-bag.svg", type: data.type || "unknown" };
            }
            if (itemObj) {
              toolSlots[sIdx][tIdx] = itemObj;
              renderToolSlots();
              updateSlotsUI();
            }
          } catch(err) { console.error(err); }
        };
        container.appendChild(toolEl);
      }
    });
  }

  function showInventoryPicker(callback) {
    const items = getActorInventory();
    if (items.length === 0) {
      ui.notifications.warn("Nessun oggetto nell'inventario del personaggio.");
      return;
    }

    const pickerHtml = `
      <div style="padding:12px; background:#0f172a; color:#f3f4f6; height:100%; display:flex; flex-direction:column; border-radius:8px;">
        <input type="text" id="picker-search" placeholder="Cerca oggetto da inserire..." style="width:100%; margin-bottom:12px; padding:8px; background:#020617; border:1px solid #334155; border-radius:6px; color:#f3f4f6;">
        <div id="picker-list" style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex-grow:1; padding-right:4px; max-height:350px;"></div>
      </div>
    `;

    renderUniversalDialog({
      title: `Scegli un Materiale o Strumento`,
      content: pickerHtml,
      width: 340,
      height: 450,
      renderCB: (pickerRoot, dialogInst) => {
        const list = pickerRoot.querySelector('#picker-list');
        const searchInp = pickerRoot.querySelector('#picker-search');

        function renderList(query = "") {
          list.innerHTML = "";
          const filtered = items.filter(i => i.name.toLowerCase().includes(query));
          if (filtered.length === 0) {
            list.innerHTML = `<div style="text-align:center; color:#64748b; font-size:12px; padding:10px;">Nessun oggetto corrispondente.</div>`;
            return;
          }
          filtered.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; cursor:pointer; transition:all 0.2s;";
            const qtyBadge = item.quantity > 1 ? `<span style="font-size:11px; font-weight:bold; color:#f59e0b; background:#020617; padding:2px 6px; border-radius:8px; border:1px solid #f59e0b;">x${item.quantity}</span>` : '';
            row.innerHTML = `
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="${item.img}" style="width:28px; height:28px; border-radius:4px; object-fit:cover;">
                <span style="font-weight:bold; font-size:13px; color:#f3f4f6;">${item.name}</span>
              </div>
              ${qtyBadge}
            `;
            row.onmouseenter = () => { row.style.borderColor = '#f59e0b'; row.style.transform = 'translateY(-2px)'; };
            row.onmouseleave = () => { row.style.borderColor = '#334155'; row.style.transform = 'none'; };
            row.onclick = () => {
              callback(item);
              if (dialogInst && dialogInst.close) dialogInst.close();
            };
            list.appendChild(row);
          });
        }
        renderList();
        if (searchInp) searchInp.oninput = (e) => renderList(e.target.value.toLowerCase());
      }
    });
  }

  function showAllItemsPicker(title, callback) {
    const invItems = getActorInventory().map(i => ({ id: i.id, name: i.name, uuid: i.uuid, img: i.img, type: i.type, source: "Inventario" }));
    const compItems = compendiumItems.map(i => ({ id: i.id, name: i.name, uuid: i.uuid, img: i.img, type: i.type, source: i.packTitle || "Compendio" }));
    const allItems = [...invItems, ...compItems];

    const pickerHtml = `
      <div style="padding:12px; background:#0f172a; color:#f3f4f6; height:100%; display:flex; flex-direction:column; border-radius:8px;">
        <input type="text" id="recipe-picker-search" placeholder="Cerca oggetto o materiale..." style="width:100%; margin-bottom:12px; padding:8px; background:#020617; border:1px solid #334155; border-radius:6px; color:#f3f4f6; font-size:12px;">
        <div id="recipe-picker-list" style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; flex-grow:1; padding-right:4px; max-height:350px;"></div>
      </div>
    `;

    renderUniversalDialog({
      title: title || "Scegli un Oggetto",
      content: pickerHtml,
      width: 360,
      height: 480,
      renderCB: (pickerRoot, dialogInst) => {
        const list = pickerRoot.querySelector('#recipe-picker-list');
        const searchInp = pickerRoot.querySelector('#recipe-picker-search');

        function renderList(query = "") {
          list.innerHTML = "";
          const filtered = allItems.filter(i => i.name.toLowerCase().includes(query)).slice(0, 80);
          if (filtered.length === 0) {
            list.innerHTML = `<div style="text-align:center; color:#64748b; font-size:12px; padding:10px;">Nessun oggetto trovato.</div>`;
            return;
          }
          filtered.forEach(item => {
            const row = document.createElement('div');
            row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:8px; background:#1e293b; border:1px solid #334155; border-radius:6px; cursor:pointer; transition:all 0.2s;";
            row.innerHTML = `
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="${item.img}" style="width:28px; height:28px; border-radius:4px; object-fit:cover;">
                <div>
                  <div style="font-weight:bold; font-size:12px; color:#f3f4f6;">${item.name}</div>
                  <div style="font-size:9px; color:#94a3b8;">${item.source}</div>
                </div>
              </div>
            `;
            row.onmouseenter = () => { row.style.borderColor = '#f59e0b'; row.style.transform = 'translateY(-2px)'; };
            row.onmouseleave = () => { row.style.borderColor = '#334155'; row.style.transform = 'none'; };
            row.onclick = () => {
              callback({ id: item.id, name: item.name, uuid: item.uuid, img: item.img, type: item.type });
              if (dialogInst && dialogInst.close) dialogInst.close();
            };
            list.appendChild(row);
          });
        }
        renderList();
        if (searchInp) searchInp.oninput = (e) => renderList(e.target.value.toLowerCase());
      }
    });
  }

  const viewWorkbench = root.querySelector('#fvtt-view-workbench');
  const viewCompendium = root.querySelector('#fvtt-view-compendium');
  const viewRecipes = root.querySelector('#fvtt-view-recipes');

  const btnWorkbench = root.querySelector('#fvtt-tab-btn-bench');
  const btnCompendium = root.querySelector('#fvtt-tab-btn-compendium');
  const btnRecipes = root.querySelector('#fvtt-tab-btn-recipes');

  if (btnWorkbench) {
    btnWorkbench.addEventListener('click', (e) => {
      e?.preventDefault();
      if (viewWorkbench) viewWorkbench.style.display = 'grid';
      if (viewCompendium) viewCompendium.style.display = 'none';
      if (viewRecipes) viewRecipes.style.display = 'none';
      btnWorkbench.classList.add('active');
      btnCompendium?.classList.remove('active');
      btnRecipes?.classList.remove('active');
    });
  }

  if (btnCompendium) {
    btnCompendium.addEventListener('click', (e) => {
      e?.preventDefault();
      if (viewWorkbench) viewWorkbench.style.display = 'none';
      if (viewCompendium) viewCompendium.style.display = 'flex';
      if (viewRecipes) viewRecipes.style.display = 'none';
      btnCompendium.classList.add('active');
      btnWorkbench?.classList.remove('active');
      btnRecipes?.classList.remove('active');
      renderCompendiumList();
    });
  }

  if (btnRecipes) {
    btnRecipes.addEventListener('click', (e) => {
      e?.preventDefault();
      if (viewWorkbench) viewWorkbench.style.display = 'none';
      if (viewCompendium) viewCompendium.style.display = 'none';
      if (viewRecipes) viewRecipes.style.display = 'flex';
      btnRecipes.classList.add('active');
      btnWorkbench?.classList.remove('active');
      btnCompendium?.classList.remove('active');
      renderRecipeList();
    });
  }

  const subtabStd = root.querySelector('#fvtt-subtab-std');
  const subtabAdv = root.querySelector('#fvtt-subtab-adv');
  const subtabPro = root.querySelector('#fvtt-subtab-pro');
  const subtabMst = root.querySelector('#fvtt-subtab-mst');
  const subtabDark = root.querySelector('#fvtt-subtab-dark');
  const subtabWeaponGem = root.querySelector('#fvtt-subtab-gem');
  const subtabRepair = root.querySelector('#fvtt-subtab-repair');
  const subtabCoating = root.querySelector('#fvtt-subtab-coating');

  const slot2Container = root.querySelector('#fvtt-slot-2-container');
  const reagentsContainer = root.querySelector('#fvtt-reagents-container');
  const catalystsContainer = root.querySelector('#fvtt-catalysts-container');
  const arcaneContainer = root.querySelector('#fvtt-arcane-container');
  const darkContainer = root.querySelector('#fvtt-dark-container');

  function clearAndResetSlots() {
    activeLoadedRecipeId = null;
    selectedSlots = [null, null, null];
    selectedQty = [1, 1, 1];
    reagentSlots = [null, null, null, null, null];
    reagentQty = [1, 1, 1, 1, 1];
    catalystSlots = isSpecialJob ? [null, null, null] : [null, null];
    catalystQty = isSpecialJob ? [1, 1, 1] : [1, 1];
    arcaneSlots = [null, null];
    arcaneQty = [1, 1];
    darkSlots = [null, null, null, null, null];
    darkQty = [1, 1, 1, 1, 1];
    toolSlots = isSpecialJob ? [[null,null],[null,null],[null,null]] : [ [null, null, null], [null, null], [null] ];
    renderInventory();
    renderToolSlots();
    updateSlotsUI();
  }

  function setCraftingMode(mode) {
    if (isSpecialJob) {
      const needed = getSpecialCraftingStarRequirement(mode) || 1;
      if (['std','adv','pro','mst'].includes(mode) && jobStats.level < needed) {
        ui.notifications.warn(`⚠️ Servono almeno ${needed} Stelle per accedere a questo tipo di crafting!`);
        return;
      }
    } else {
      if (mode === 'adv' && jobStats.level < 4) {
        ui.notifications.warn("⚠️ Devi raggiungere il Livello 4 (e 5 ⭐ Prestige) per accedere al crafting Avanzato!");
        return;
      }
      if (mode === 'pro' && jobStats.level < 7) {
        ui.notifications.warn("⚠️ Devi raggiungere il Livello 7 (e 10 ⭐ Prestige) per accedere al crafting Professionale!");
        return;
      }
      if (mode === 'mst' && jobStats.level < 10) {
        ui.notifications.warn("⚠️ Devi raggiungere il Livello 10 (e 50 ⭐ Prestige) per accedere al crafting Master!");
        return;
      }
    }

    activeCraftingMode = mode;
    [subtabStd, subtabAdv, subtabPro, subtabMst, subtabDark, subtabWeaponGem, subtabRepair, subtabCoating].forEach(b => b?.classList.remove('active'));
    clearAndResetSlots();

    const useSpecialMaskLayout = isSpecialJob && !['weapon_gem','repair','coating'].includes(mode);
    if (useSpecialMaskLayout) {
      if (slot2Container) slot2Container.style.display = 'flex';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'block';
      if (arcaneContainer) arcaneContainer.style.display = 'block';
      if (darkContainer) darkContainer.style.display = mode === 'dark_art' ? 'block' : 'none';
    }

    if (mode === 'std') {
      subtabStd?.classList.add('active');
      if (slot2Container) slot2Container.style.display = 'none';
      if (reagentsContainer) reagentsContainer.style.display = 'none';
      if (catalystsContainer) catalystsContainer.style.display = 'none';
      if (arcaneContainer) arcaneContainer.style.display = 'none';
      if (darkContainer) darkContainer.style.display = 'none';
    } else if (mode === 'adv') {
      subtabAdv?.classList.add('active');
      if (slot2Container) slot2Container.style.display = 'none';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'none';
      if (arcaneContainer) arcaneContainer.style.display = 'none';
      if (darkContainer) darkContainer.style.display = 'none';
    } else if (mode === 'pro') {
      subtabPro?.classList.add('active');
      if (slot2Container) slot2Container.style.display = 'flex';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'block';
      if (arcaneContainer) arcaneContainer.style.display = 'none';
      if (darkContainer) darkContainer.style.display = 'none';
    } else if (mode === 'mst') {
      subtabMst?.classList.add('active');
      if (slot2Container) slot2Container.style.display = 'flex';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'block';
      if (arcaneContainer) arcaneContainer.style.display = 'block';
      if (darkContainer) darkContainer.style.display = 'none';
    } else if (mode === 'dark_art') {
      subtabDark?.classList.add('active');
      if (slot2Container) slot2Container.style.display = 'flex';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'block';
      if (arcaneContainer) arcaneContainer.style.display = 'none';
      if (darkContainer) darkContainer.style.display = 'block';
    } else if (mode === 'repair') {
      subtabRepair?.classList.add('active');
      if (slot2Container) slot2Container.style.display = 'none';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'none';
      if (arcaneContainer) arcaneContainer.style.display = 'none';
      if (darkContainer) darkContainer.style.display = 'none';
    } else if (mode === 'coating') {
      subtabCoating?.classList.add('active');
      if (slot2Container) slot2Container.style.display = 'none';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'none';
      if (arcaneContainer) arcaneContainer.style.display = 'none';
      if (darkContainer) darkContainer.style.display = 'none';
    } else if (mode === 'weapon_gem') {
      subtabWeaponGem?.classList.add('active');
      if (slot2Container) slot2Container.style.display = 'none';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'none';
      if (arcaneContainer) arcaneContainer.style.display = 'block';
      if (darkContainer) darkContainer.style.display = 'none';
    }

    // Nei job speciali la maschera crafting standard mantiene sempre tutti i suoi slot.
    // Forature/Gemme, Rivestimenti e Riparazioni conservano invece esattamente il layout originale.
    if (useSpecialMaskLayout) {
      if (slot2Container) slot2Container.style.display = 'flex';
      if (reagentsContainer) reagentsContainer.style.display = 'block';
      if (catalystsContainer) catalystsContainer.style.display = 'block';
      if (arcaneContainer) arcaneContainer.style.display = 'block';
    }

    // Il banco speciale normale usa 1 sola Energia Arcana; Forature & Gemme mantiene le 2 originali.
    const arcaneSecond = root.querySelector('#fvtt-arcane-1')?.parentElement;
    const arcaneTitle = arcaneContainer?.querySelector('div');
    if (isSpecialJob && useSpecialMaskLayout) {
      if (arcaneSecond) arcaneSecond.style.display = 'none';
      if (arcaneTitle) arcaneTitle.innerHTML = '<i class="fa-solid fa-bolt-lightning"></i> Energia Arcana (Max 1):';
    } else if (activeCraftingMode === 'weapon_gem') {
      if (arcaneSecond) arcaneSecond.style.display = 'flex';
      if (arcaneTitle) arcaneTitle.innerHTML = '<i class="fa-solid fa-bolt-lightning"></i> Energia Arcana (Max 2):';
    }
  }

  if (subtabStd) subtabStd.addEventListener('click', (e) => { e.preventDefault(); setCraftingMode('std'); });
  if (subtabAdv) subtabAdv.addEventListener('click', (e) => { e.preventDefault(); setCraftingMode('adv'); });
  if (subtabPro) subtabPro.addEventListener('click', (e) => { e.preventDefault(); setCraftingMode('pro'); });
  if (subtabMst) subtabMst.addEventListener('click', (e) => { e.preventDefault(); setCraftingMode('mst'); });
  if (subtabDark) subtabDark.addEventListener('click', (e) => { e.preventDefault(); setCraftingMode('dark_art'); });
  if (subtabWeaponGem) subtabWeaponGem.addEventListener('click', (e) => { e.preventDefault(); setCraftingMode('weapon_gem'); });
  if (subtabRepair) subtabRepair.addEventListener('click', (e) => { e.preventDefault(); setCraftingMode('repair'); });
  if (subtabCoating) subtabCoating.addEventListener('click', (e) => { e.preventDefault(); setCraftingMode('coating'); });

  function findRecipeMatch() {
    if (!selectedSlots[0] || !selectedSlots[1]) return null;

    const chooseMatchedRecipe = (candidates) => {
      if (!Array.isArray(candidates) || candidates.length === 0) return null;
      if (activeLoadedRecipeId) {
        const exactLoaded = candidates.find(r => r.id === activeLoadedRecipeId);
        if (exactLoaded) return exactLoaded;
      }
      // Se esistono due combinazioni identiche, una ricetta già nota/pubblica ha priorità
      // su una segreta ancora sconosciuta, evitando falsi indizi al giocatore.
      return candidates.find(r => !isUndiscoveredSecretRecipe(r)) || candidates[0] || null;
    };

    const item1 = selectedSlots[0];
    const item2 = selectedSlots[1];

    if (activeCraftingMode === 'weapon_gem') {
      const realWep = actor.items.get(item1.id) || item1;
      if (!(realWep.type === 'weapon' && realWep.flags?.['foundry-weapon-system']?.isRealistic)) return null;

      const activeReagents = reagentSlots.filter(r => r !== null).map(r => r.name.toLowerCase().trim()).sort();
      const activeArcanes = arcaneSlots.filter(a => a !== null).map(a => a.name.toLowerCase().trim()).sort();

      const validateGemRecipe = (r) => {
        if (!isWeaponGemRecipe(r)) return false;
        const recipeWeapon = r.ing1 || '';
        if (!isGenericWeaponRequirement(recipeWeapon) && recipeWeapon.toLowerCase().trim() !== realWep.name.toLowerCase().trim()) return false;
        if (!weaponMatchesRecipeRarity(r, realWep)) return false;
        if (!r.ing2 || item2.name.toLowerCase().trim() !== r.ing2.toLowerCase().trim()) return false;

        const recipeReagents = (r.reagents || []).map(reg => typeof reg === 'string' ? reg.toLowerCase().trim() : reg.name.toLowerCase().trim()).sort();
        if (activeReagents.length !== recipeReagents.length) return false;
        if (!recipeReagents.every((val, idx) => val === activeReagents[idx])) return false;

        const recipeArcanes = (r.arcanes || []).map(arc => typeof arc === 'string' ? arc.toLowerCase().trim() : arc.name.toLowerCase().trim()).sort();
        if (activeArcanes.length !== recipeArcanes.length) return false;
        if (!recipeArcanes.every((val, idx) => val === activeArcanes[idx])) return false;

        return true;
      };

      return chooseMatchedRecipe(recipes.filter(validateGemRecipe));
    }

    if (activeCraftingMode === 'repair') {
      const isWeapon = item1.type === 'weapon';
      if (!isWeapon) return null;

      const activeReagents = reagentSlots.filter(r => r !== null).map(r => r.name.toLowerCase().trim()).sort();

      return chooseMatchedRecipe(recipes.filter(r => {
        if (r.type !== 'repair' && !r.isRepair) return false;
        if (item2.name.toLowerCase().trim() !== (r.ing2 || "").toLowerCase().trim()) return false;

        const recipeReagents = (r.reagents || []).map(reg => typeof reg === 'string' ? reg.toLowerCase().trim() : reg.name.toLowerCase().trim()).sort();
        if (activeReagents.length !== recipeReagents.length) return false;
        if (!recipeReagents.every((val, idx) => val === activeReagents[idx])) return false;

        return true;
      }));
    }

    if (activeCraftingMode === 'coating') {
      const realWep = actor.items.get(item1.id) || item1;
      const isWeapon = realWep.type === 'weapon' && realWep.flags?.["foundry-weapon-system"]?.isRealistic;
      
      if (!isWeapon) return null;

      const activeReagents = reagentSlots.filter(r => r !== null).map(r => r.name.toLowerCase().trim()).sort();

      return chooseMatchedRecipe(recipes.filter(r => {
        if (r.type !== 'coating' && !r.isCoating) return false;
        if (!r.ing2 || item2.name.toLowerCase().trim() !== r.ing2.toLowerCase().trim()) return false;

        const recipeReagents = (r.reagents || []).map(reg => typeof reg === 'string' ? reg.toLowerCase().trim() : reg.name.toLowerCase().trim()).sort();
        if (activeReagents.length !== recipeReagents.length) return false;
        if (!recipeReagents.every((val, idx) => val === activeReagents[idx])) return false;

        return true;
      }));
    }

    const useSpecialRecipeLayout = isSpecialJob && !['weapon_gem', 'repair', 'coating'].includes(activeCraftingMode);
    if ((useSpecialRecipeLayout || activeCraftingMode === 'pro' || activeCraftingMode === 'mst' || activeCraftingMode === 'dark_art') && !selectedSlots[2]) return null;

    const mainNames = selectedSlots.filter(s => s !== null).map(s => s.name.toLowerCase()).sort();
    const activeReagents = reagentSlots.filter(r => r !== null).map(r => r.name.toLowerCase().trim()).sort();
    const activeCatalysts = catalystSlots.filter(c => c !== null).map(c => c.name.toLowerCase()).sort();
    const activeArcanes = arcaneSlots.filter(a => a !== null).map(a => a.name.toLowerCase()).sort();
    const activeDarks = darkSlots.filter(d => d !== null).map(d => d.name.toLowerCase()).sort();

    return chooseMatchedRecipe(recipes.filter(r => {
      if (r.type === 'repair' || r.isRepair || r.type === 'coating' || r.isCoating) return false;
      
      const rType = r.type || 'std';
      const isDarkRecipe = rType === 'dark_art' || (r.darkReagents && r.darkReagents.length > 0) || r.darkReagent;
      if (isDarkRecipe && !hasDarkArt) return false;

      const rMains = [r.ing1, r.ing2, r.ing3].filter(Boolean).map(s => s.toLowerCase()).sort();
      if (mainNames.length !== rMains.length) return false;
      const matchMains = rMains.every((val, idx) => val === mainNames[idx]);
      if (!matchMains) return false;

      const recipeReagents = (r.reagents || []).map(reg => typeof reg === 'string' ? reg.toLowerCase() : reg.name.toLowerCase()).sort();
      if (useSpecialRecipeLayout || activeCraftingMode !== 'std' || recipeReagents.length > 0) {
        if (activeReagents.length !== recipeReagents.length) return false;
        if (!recipeReagents.every((val, idx) => val === activeReagents[idx])) return false;
      }

      const recipeCatalysts = (r.catalysts || []).map(cat => typeof cat === 'string' ? cat : cat.name.toLowerCase()).sort();
      if (useSpecialRecipeLayout || activeCraftingMode === 'pro' || activeCraftingMode === 'mst' || activeCraftingMode === 'dark_art' || recipeCatalysts.length > 0) {
        if (activeCatalysts.length !== recipeCatalysts.length) return false;
        if (!recipeCatalysts.every((val, idx) => val === activeCatalysts[idx])) return false;
      }

      const recipeArcanes = (r.arcanes || []).map(arc => typeof arc === 'string' ? arc : arc.name.toLowerCase()).sort();
      if (useSpecialRecipeLayout || activeCraftingMode === 'mst' || recipeArcanes.length > 0) {
        if (activeArcanes.length !== recipeArcanes.length) return false;
        if (!recipeArcanes.every((val, idx) => val === activeArcanes[idx])) return false;
      }

      const recipeDarks = (r.darkReagents || (r.darkReagent ? [r.darkReagent] : [])).map(drk => typeof drk === 'string' ? drk : drk.name.toLowerCase()).sort();
      if (activeCraftingMode === 'dark_art' || recipeDarks.length > 0) {
        if (activeDarks.length !== recipeDarks.length) return false;
        if (!recipeDarks.every((val, idx) => val === activeDarks[idx])) return false;
      }

      return true;
    }));
  }

  function updateSlotsUI() {
    const match = findRecipeMatch();
    const hideSecretRequirements = !!match && isUndiscoveredSecretRecipe(match);
    let isQuantityValid = true;
    let isLevelValid = true;
    let areToolsValid = true;

    [0, 1, 2].forEach(idx => {
      const slotEl = root.querySelector(`#fvtt-slot-${idx}`);
      const lblEl = root.querySelector(`#fvtt-slot-${idx}-lbl`);
      const qtyEl = root.querySelector(`#fvtt-slot-${idx}-qty`);
      const item = selectedSlots[idx];

      if (slotEl && lblEl && qtyEl) {
        if (item) {
          slotEl.classList.add('filled');
          slotEl.innerHTML = `<img src="${item.img}" style="width:48px; height:48px; border-radius:6px; object-fit:cover;">`;
          lblEl.innerText = item.name;

          const ownedQty = getActorItemQuantity(actor, item.name);
          let reqQty = 1;

          if (match) {
            if (activeCraftingMode === 'repair' || activeCraftingMode === 'coating') {
              reqQty = idx === 1 ? (match.qty2 || 1) : 1;
            } else {
              if (match.ing1?.toLowerCase() === item.name.toLowerCase()) reqQty = match.qty1 || 1;
              else if (match.ing2?.toLowerCase() === item.name.toLowerCase()) reqQty = match.qty2 || 1;
              else if (match.ing3?.toLowerCase() === item.name.toLowerCase()) reqQty = match.qty3 || 1;
            }
          }

          if (!hideSecretRequirements && selectedQty[idx] < reqQty) selectedQty[idx] = reqQty;
          if (hideSecretRequirements && selectedQty[idx] < 1) selectedQty[idx] = 1;
          if (selectedQty[idx] > ownedQty) selectedQty[idx] = ownedQty;

          const hasEnough = hideSecretRequirements
            ? (ownedQty >= selectedQty[idx] && selectedQty[idx] >= reqQty)
            : (ownedQty >= reqQty);
          if (match && !hasEnough) isQuantityValid = false;

          const shownMin = hideSecretRequirements ? 1 : reqQty;
          const shownStatus = hideSecretRequirements ? `/ ${ownedQty}` : `/${reqQty}`;
          qtyEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:2px; justify-content:center; margin-top:2px;">
              <input type="number" class="fvtt-input main-qty-inp" data-slot="${idx}" min="${shownMin}" max="${ownedQty}" value="${selectedQty[idx]}" style="width:42px; text-align:center; padding:1px; font-size:10px;">
              <span class="${hasEnough ? 'qty-status-ok' : 'qty-status-err'}" style="font-size:9px;">${shownStatus}</span>
            </div>
          `;

          const inp = qtyEl.querySelector('.main-qty-inp');
          if (inp) {
            inp.onchange = (e) => {
              const fallback = hideSecretRequirements ? 1 : reqQty;
              const val = Math.max(shownMin, Math.min(ownedQty, parseInt(e.target.value) || fallback));
              selectedQty[idx] = val;
              updateSlotsUI();
            };
          }
        } else {
          slotEl.classList.remove('filled');
          slotEl.innerHTML = `<i class="fa-solid fa-plus" style="font-size: 20px; color: ${idx === 2 ? '#c084fc' : '#9ca3af'};"></i>`;
          if (activeCraftingMode === 'repair' || activeCraftingMode === 'coating') {
             lblEl.innerText = idx === 0 ? "Arma Realistica" : "Materiale";
          } else if (activeCraftingMode === 'weapon_gem') {
             lblEl.innerText = idx === 0 ? "Arma Realistica" : 'Oggetto / Gemma';
          } else {
             lblEl.innerText = `Slot ${idx + 1}`;
          }
          qtyEl.innerText = "";
        }
      }
    });

    if (match && match.tools) {
      match.tools.forEach((reqToolList, sIdx) => {
        if (Array.isArray(reqToolList)) {
          reqToolList.forEach((reqTool, tIdx) => {
            if (reqTool && reqTool.name) {
              const currentPlacedTool = toolSlots[sIdx]?.[tIdx];
              if (!currentPlacedTool || currentPlacedTool.name.toLowerCase().trim() !== reqTool.name.toLowerCase().trim()) {
                areToolsValid = false;
              }
            }
          });
        }
      });
    }

    [0, 1, 2, 3, 4].forEach(rIdx => {
      const rSlotEl = root.querySelector(`#fvtt-reagent-${rIdx}`);
      const rQtyEl = root.querySelector(`#fvtt-reagent-${rIdx}-qty`);
      const rItem = reagentSlots[rIdx];

      if (rSlotEl && rQtyEl) {
        if (rItem) {
          rSlotEl.classList.add('filled');
          rSlotEl.innerHTML = `<img src="${rItem.img}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">`;

          const ownedQty = getActorItemQuantity(actor, rItem.name);
          let reqQty = 1;

          if (match && match.reagents) {
            const foundReagent = match.reagents.find(reg => {
              const name = typeof reg === 'string' ? reg : reg.name;
              return name.toLowerCase() === rItem.name.toLowerCase();
            });
            if (foundReagent) reqQty = typeof foundReagent === 'string' ? 1 : (foundReagent.qty || 1);
          }

          if (!hideSecretRequirements && reagentQty[rIdx] < reqQty) reagentQty[rIdx] = reqQty;
          if (hideSecretRequirements && reagentQty[rIdx] < 1) reagentQty[rIdx] = 1;
          if (reagentQty[rIdx] > ownedQty) reagentQty[rIdx] = ownedQty;

          const hasEnough = hideSecretRequirements
            ? (ownedQty >= reagentQty[rIdx] && reagentQty[rIdx] >= reqQty)
            : (ownedQty >= reagentQty[rIdx]);
          if (match && !hasEnough) isQuantityValid = false;

          const shownMin = hideSecretRequirements ? 1 : reqQty;
          const shownStatus = hideSecretRequirements ? `/ ${ownedQty}` : `/${reqQty}`;
          rQtyEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:2px; justify-content:center; margin-top:2px;">
              <input type="number" class="fvtt-input reg-qty-inp" data-slot="${rIdx}" min="${shownMin}" max="${ownedQty}" value="${reagentQty[rIdx]}" style="width:38px; text-align:center; padding:1px; font-size:9px;">
              <span class="${hasEnough ? 'qty-status-ok' : 'qty-status-err'}" style="font-size:8px;">${shownStatus}</span>
            </div>
          `;

          const inp = rQtyEl.querySelector('.reg-qty-inp');
          if (inp) {
            inp.onchange = (e) => {
              const fallback = hideSecretRequirements ? 1 : reqQty;
              reagentQty[rIdx] = Math.max(shownMin, Math.min(ownedQty, parseInt(e.target.value) || fallback));
              updateSlotsUI();
            };
          }
        } else {
          rSlotEl.classList.remove('filled');
          rSlotEl.innerHTML = `<i class="fa-solid fa-flask" style="font-size: 16px; color: #38bdf8;"></i>`;
          rQtyEl.innerText = "";
        }
      }
    });

    catalystSlots.forEach((_, cIdx) => {
      const cSlotEl = root.querySelector(`#fvtt-catalyst-${cIdx}`);
      const cQtyEl = root.querySelector(`#fvtt-catalyst-${cIdx}-qty`);
      const cItem = catalystSlots[cIdx];

      if (cSlotEl && cQtyEl) {
        if (cItem) {
          cSlotEl.classList.add('filled');
          cSlotEl.innerHTML = `<img src="${cItem.img}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">`;

          const ownedQty = getActorItemQuantity(actor, cItem.name);
          let reqQty = 1;

          if (match && match.catalysts) {
            const foundCatalyst = match.catalysts.find(cat => {
              const name = typeof cat === 'string' ? cat : cat.name;
              return name.toLowerCase() === cItem.name.toLowerCase();
            });
            if (foundCatalyst) reqQty = typeof foundCatalyst === 'string' ? 1 : (foundCatalyst.qty || 1);
          }

          if (!hideSecretRequirements && catalystQty[cIdx] < reqQty) catalystQty[cIdx] = reqQty;
          if (hideSecretRequirements && catalystQty[cIdx] < 1) catalystQty[cIdx] = 1;
          if (catalystQty[cIdx] > ownedQty) catalystQty[cIdx] = ownedQty;

          const hasEnough = hideSecretRequirements
            ? (ownedQty >= catalystQty[cIdx] && catalystQty[cIdx] >= reqQty)
            : (ownedQty >= catalystQty[cIdx]);
          if (match && !hasEnough) isQuantityValid = false;

          const shownMin = hideSecretRequirements ? 1 : reqQty;
          const shownStatus = hideSecretRequirements ? `/ ${ownedQty}` : `/${reqQty}`;
          cQtyEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:2px; justify-content:center; margin-top:2px;">
              <input type="number" class="fvtt-input cat-qty-inp" data-slot="${cIdx}" min="${shownMin}" max="${ownedQty}" value="${catalystQty[cIdx]}" style="width:38px; text-align:center; padding:1px; font-size:9px;">
              <span class="${hasEnough ? 'qty-status-ok' : 'qty-status-err'}" style="font-size:8px;">${shownStatus}</span>
            </div>
          `;

          const inp = cQtyEl.querySelector('.cat-qty-inp');
          if (inp) {
            inp.onchange = (e) => {
              const fallback = hideSecretRequirements ? 1 : reqQty;
              catalystQty[cIdx] = Math.max(shownMin, Math.min(ownedQty, parseInt(e.target.value) || fallback));
              updateSlotsUI();
            };
          }
        } else {
          cSlotEl.classList.remove('filled');
          cSlotEl.innerHTML = `<i class="fa-solid fa-atom" style="font-size: 18px; color: #c084fc;"></i>`;
          cQtyEl.innerText = "";
        }
      }
    });

    arcaneSlots.forEach((_, aIdx) => {
      const aSlotEl = root.querySelector(`#fvtt-arcane-${aIdx}`);
      const aQtyEl = root.querySelector(`#fvtt-arcane-${aIdx}-qty`);
      const aItem = arcaneSlots[aIdx];

      if (aSlotEl && aQtyEl) {
        if (aItem) {
          aSlotEl.classList.add('filled');
          aSlotEl.innerHTML = `<img src="${aItem.img}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">`;

          const ownedQty = getActorItemQuantity(actor, aItem.name);
          let reqQty = 1;

          if (match && match.arcanes) {
            const foundArcane = match.arcanes.find(arc => {
              const name = typeof arc === 'string' ? arc : arc.name;
              return name.toLowerCase() === aItem.name.toLowerCase();
            });
            if (foundArcane) reqQty = typeof foundArcane === 'string' ? 1 : (foundArcane.qty || 1);
          }

          if (!hideSecretRequirements && arcaneQty[aIdx] < reqQty) arcaneQty[aIdx] = reqQty;
          if (hideSecretRequirements && arcaneQty[aIdx] < 1) arcaneQty[aIdx] = 1;
          if (arcaneQty[aIdx] > ownedQty) arcaneQty[aIdx] = ownedQty;

          const hasEnough = hideSecretRequirements
            ? (ownedQty >= arcaneQty[aIdx] && arcaneQty[aIdx] >= reqQty)
            : (ownedQty >= arcaneQty[aIdx]);
          if (match && !hasEnough) isQuantityValid = false;

          const shownMin = hideSecretRequirements ? 1 : reqQty;
          const shownStatus = hideSecretRequirements ? `/ ${ownedQty}` : `/${reqQty}`;
          aQtyEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:2px; justify-content:center; margin-top:2px;">
              <input type="number" class="fvtt-input arc-qty-inp" data-slot="${aIdx}" min="${shownMin}" max="${ownedQty}" value="${arcaneQty[aIdx]}" style="width:38px; text-align:center; padding:1px; font-size:9px;">
              <span class="${hasEnough ? 'qty-status-ok' : 'qty-status-err'}" style="font-size:8px;">${shownStatus}</span>
            </div>
          `;

          const inp = aQtyEl.querySelector('.arc-qty-inp');
          if (inp) {
            inp.onchange = (e) => {
              const fallback = hideSecretRequirements ? 1 : reqQty;
              arcaneQty[aIdx] = Math.max(shownMin, Math.min(ownedQty, parseInt(e.target.value) || fallback));
              updateSlotsUI();
            };
          }
        } else {
          aSlotEl.classList.remove('filled');
          aSlotEl.innerHTML = `<i class="fa-solid fa-bolt-lightning" style="font-size: 18px; color: #67e8f9;"></i>`;
          aQtyEl.innerText = "";
        }
      }
    });

    [0, 1, 2, 3, 4].forEach(dIdx => {
      const dSlotEl = root.querySelector(`#fvtt-dark-slot-${dIdx}`);
      const dQtyEl = root.querySelector(`#fvtt-dark-slot-${dIdx}-qty`);
      const dItem = darkSlots[dIdx];

      if (dSlotEl && dQtyEl) {
        if (dItem) {
          dSlotEl.classList.add('filled');
          dSlotEl.innerHTML = `<img src="${dItem.img}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">`;

          const ownedQty = getActorItemQuantity(actor, dItem.name);
          let reqQty = 1;

          const matchDarkList = match?.darkReagents || (match?.darkReagent ? [match.darkReagent] : []);
          if (match && matchDarkList.length > 0) {
            const foundDark = matchDarkList.find(drk => {
              const name = typeof drk === 'string' ? drk : drk.name;
              return name.toLowerCase() === dItem.name.toLowerCase();
            });
            if (foundDark) reqQty = typeof foundDark === 'string' ? 1 : (foundDark.qty || 1);
          }

          if (!hideSecretRequirements && darkQty[dIdx] < reqQty) darkQty[dIdx] = reqQty;
          if (hideSecretRequirements && darkQty[dIdx] < 1) darkQty[dIdx] = 1;
          if (darkQty[dIdx] > ownedQty) darkQty[dIdx] = ownedQty;

          const hasEnough = hideSecretRequirements
            ? (ownedQty >= darkQty[dIdx] && darkQty[dIdx] >= reqQty)
            : (ownedQty >= darkQty[dIdx]);
          if (match && !hasEnough) isQuantityValid = false;

          const shownMin = hideSecretRequirements ? 1 : reqQty;
          const shownStatus = hideSecretRequirements ? `/ ${ownedQty}` : `/${reqQty}`;
          dQtyEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:2px; justify-content:center; margin-top:2px;">
              <input type="number" class="fvtt-input dark-qty-inp" data-slot="${dIdx}" min="${shownMin}" max="${ownedQty}" value="${darkQty[dIdx]}" style="width:38px; text-align:center; padding:1px; font-size:9px;">
              <span class="${hasEnough ? 'qty-status-ok' : 'qty-status-err'}" style="font-size:8px;">${shownStatus}</span>
            </div>
          `;

          const inp = dQtyEl.querySelector('.dark-qty-inp');
          if (inp) {
            inp.onchange = (e) => {
              const fallback = hideSecretRequirements ? 1 : reqQty;
              darkQty[dIdx] = Math.max(shownMin, Math.min(ownedQty, parseInt(e.target.value) || fallback));
              updateSlotsUI();
            };
          }
        } else {
          dSlotEl.classList.remove('filled');
          dSlotEl.innerHTML = `<i class="fa-solid fa-skull" style="font-size: 18px; color: #fb7185;"></i>`;
          dQtyEl.innerText = "";
        }
      }
    });

    const resSlot = root.querySelector('#fvtt-slot-res');
    const resLbl = root.querySelector('#fvtt-slot-res-lbl');
    const craftBtn = root.querySelector('#fvtt-btn-do-craft');
    const badgeContainer = root.querySelector('#fvtt-success-rate-badge');
    const riskWarningContainer = root.querySelector('#fvtt-risk-warning-container');

    if (resSlot && resLbl && craftBtn) {
      if (match) {
        const secretUnknown = isUndiscoveredSecretRecipe(match);
        if (activeCraftingMode === 'repair') {
          const realWep = actor.items.get(selectedSlots[0]?.id);
          const wFlags = realWep?.flags?.["foundry-weapon-system"]?.durability;
          const currentDur = wFlags?.current ?? 50;
          const maxDur = wFlags?.max ?? 100;

          const resIcon = getRecipeDefaultIcon(match, selectedSlots[0]);
          resSlot.classList.add('filled');
          resSlot.innerHTML = `<img src="${resIcon}" style="width:58px; height:58px; border-radius:8px; object-fit:cover;">`;

          if (secretUnknown && currentDur < maxDur) {
            resSlot.innerHTML = `<i class="fa-solid fa-user-secret" style="font-size:26px;color:#f87171;"></i>`;
            resLbl.innerText = "???";
            craftBtn.disabled = !isQuantityValid || !areToolsValid;
            craftBtn.innerHTML = !areToolsValid
              ? `<i class="fa-solid fa-wrench" style="color:#f87171;"></i> STRUMENTI MANCANTI`
              : `<i class="fa-solid fa-question"></i> TENTA CREAZIONE`;
            if (badgeContainer) badgeContainer.innerHTML = `<span style="font-size:10px;font-weight:bold;color:#fca5a5;background:#12070a;border:1px solid #b91c1c;padding:2px 6px;border-radius:8px;display:inline-block;"><i class="fa-solid fa-lock"></i> Ricetta non scoperta</span>`;
            if (riskWarningContainer) riskWarningContainer.innerHTML = "";
            return;
          }

          if (currentDur >= maxDur) {
            resLbl.innerText = `Arma Intatta`;
            craftBtn.disabled = true;
            craftBtn.innerHTML = `<i class="fa-solid fa-check"></i> RIPARAZIONE NON NECESSARIA`;
            if (badgeContainer) badgeContainer.innerHTML = `<span style="font-size:10px; font-weight:bold; color:#10b981; background:#020617; border:1px solid #10b981; padding:2px 6px; border-radius:8px; display:inline-block;">Durabilità Max</span>`;
          } else {
            resLbl.innerText = match.customName || `Ripara (+${match.repairAmount || 50})`;
            craftBtn.disabled = !isQuantityValid || !areToolsValid;
            craftBtn.innerHTML = !areToolsValid ? `<i class="fa-solid fa-wrench" style="color:#f87171;"></i> STRUMENTI MANCANTI` : `<i class="fa-solid fa-wrench"></i> RIPARA ARMA (+${match.expReward || 15} EXP)`;
            if (badgeContainer) badgeContainer.innerHTML = `<span style="font-size:10px; font-weight:bold; color:#38bdf8; background:#020617; border:1px solid #38bdf8; padding:2px 6px; border-radius:8px; display:inline-block;">🎯 100% Sicuro</span>`;
          }
          if (riskWarningContainer) riskWarningContainer.innerHTML = "";
          return;
        }

        if (activeCraftingMode === 'coating') {
          const resIcon = getRecipeDefaultIcon(match, selectedSlots[0]);
          resSlot.classList.add('filled');
          resSlot.innerHTML = `<img src="${resIcon}" style="width:58px; height:58px; border-radius:8px; object-fit:cover;">`;

          if (secretUnknown) {
            resSlot.innerHTML = `<i class="fa-solid fa-user-secret" style="font-size:26px;color:#f87171;"></i>`;
            resLbl.innerText = "???";
            craftBtn.disabled = !isQuantityValid || !areToolsValid;
            craftBtn.innerHTML = !areToolsValid
              ? `<i class="fa-solid fa-wrench" style="color:#f87171;"></i> STRUMENTI MANCANTI`
              : `<i class="fa-solid fa-question"></i> TENTA CREAZIONE`;
            if (badgeContainer) badgeContainer.innerHTML = `<span style="font-size:10px;font-weight:bold;color:#fca5a5;background:#12070a;border:1px solid #b91c1c;padding:2px 6px;border-radius:8px;display:inline-block;"><i class="fa-solid fa-lock"></i> Ricetta non scoperta</span>`;
            if (riskWarningContainer) riskWarningContainer.innerHTML = "";
            return;
          }

          resLbl.innerText = match.customName || `Applica Rivestimento (+${match.coatingLustro || 100} Lustro)`;
          
          craftBtn.disabled = !isQuantityValid || !areToolsValid;
          craftBtn.innerHTML = !areToolsValid ? `<i class="fa-solid fa-wrench" style="color:#f87171;"></i> STRUMENTI MANCANTI` : `<i class="fa-solid fa-layer-group"></i> APPLICA RIVESTIMENTO (+${match.expReward || 40} EXP)`;
          
          if (badgeContainer) badgeContainer.innerHTML = `<span style="font-size:10px; font-weight:bold; color:#38bdf8; background:#020617; border:1px solid #38bdf8; padding:2px 6px; border-radius:8px; display:inline-block;">🎯 100% Sicuro (Lustro +${match.coatingLustro || 100})</span>`;
          if (riskWarningContainer) riskWarningContainer.innerHTML = "";
          return;
        }

        const requiredRecipeLevel = match.requiredLevel || 1;
        const currentRate = calculateDynamicSuccessRate(match, actor, selectedSlots, selectedQty, reagentSlots, reagentQty, catalystSlots, catalystQty, arcaneSlots, arcaneQty, darkSlots, darkQty, toolSlots);

        if (jobStats.level < requiredRecipeLevel) {
          isLevelValid = false;
        }

        if (secretUnknown) {
          resSlot.classList.add('filled');
          resSlot.innerHTML = `<i class="fa-solid fa-user-secret" style="font-size:28px;color:#f87171;"></i>`;
          resSlot.oncontextmenu = null;
          resLbl.innerText = "???";
          if (badgeContainer) badgeContainer.innerHTML = `<span style="font-size:10px;font-weight:bold;color:#fca5a5;background:#12070a;border:1px solid #b91c1c;padding:2px 6px;border-radius:8px;display:inline-block;"><i class="fa-solid fa-lock"></i> Ricetta non scoperta</span>`;
          if (riskWarningContainer) riskWarningContainer.innerHTML = "";

          if (!isLevelValid) {
            craftBtn.disabled = true;
            craftBtn.innerHTML = `<i class="fa-solid fa-lock" style="color:#f87171;"></i> REQUISITI INSUFFICIENTI`;
          } else if (!areToolsValid) {
            craftBtn.disabled = true;
            craftBtn.innerHTML = `<i class="fa-solid fa-wrench" style="color:#f87171;"></i> STRUMENTI MANCANTI`;
          } else if (isQuantityValid) {
            craftBtn.disabled = false;
            craftBtn.innerHTML = `<i class="fa-solid fa-question"></i> TENTA CREAZIONE`;
          } else {
            craftBtn.disabled = true;
            craftBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#f87171;"></i> MATERIALI INSUFFICIENTI`;
          }
          return;
        }

        resSlot.classList.add('filled');
        
        const resIcon = getRecipeDefaultIcon(match, selectedSlots[0]);
        resSlot.innerHTML = `<img src="${resIcon}" style="width:58px; height:58px; border-radius:8px; object-fit:cover;">`;
        resLbl.innerText = match.customName || match.result;
        
        resSlot.oncontextmenu = async (e) => {
          e.preventDefault();
          if (match.resultUuid) {
            const doc = await fromUuid(match.resultUuid);
            if (doc) doc.sheet.render(true);
            else ui.notifications.warn("Impossibile trovare la scheda dell'oggetto.");
          } else {
            const foundInInv = actor.items.find(i => i.name.toLowerCase().trim() === match.result.toLowerCase().trim());
            if (foundInInv) foundInInv.sheet.render(true);
            else ui.notifications.info(`Oggetto Prodotto: ${match.result}`);
          }
        };

        if (badgeContainer) {
          let badgeColor = "#fbbf24";
          if (currentRate < 50) badgeColor = "#ef4444";
          else if (currentRate <= 70) badgeColor = "#94a3b8";
          else if (currentRate < 100) badgeColor = "#10b981";

          badgeContainer.innerHTML = `<span style="font-size:10px; font-weight:bold; color:${badgeColor}; background:#020617; border:1px solid ${badgeColor}; padding:2px 6px; border-radius:8px; display:inline-block;"><i class="fa-solid fa-bullseye"></i> ${currentRate}% Riuscita</span>`;
        }

        if (riskWarningContainer) {
          if (currentRate < 100) {
            riskWarningContainer.innerHTML = `<div style="font-size:10px; color:#f87171; font-weight:bold; text-align:center; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:4px 8px; border-radius:6px; margin:4px 0;"><i class="fa-solid fa-triangle-exclamation"></i> Rischio Fallimento (${currentRate}%): In caso di insuccesso i materiali andranno distrutti!</div>`;
          } else {
            riskWarningContainer.innerHTML = "";
          }
        }

        if (!isLevelValid) {
          resLbl.innerText = `Richiede Liv. ${requiredRecipeLevel}`;
          craftBtn.disabled = true;
          craftBtn.innerHTML = `<i class="fa-solid fa-lock" style="color:#f87171;"></i> LIVELLO INSUFFICIENTE (RICHIEDE ${requiredRecipeLevel})`;
        } else if (!areToolsValid) {
          resLbl.innerText = "Strumenti Mancanti";
          craftBtn.disabled = true;
          craftBtn.innerHTML = `<i class="fa-solid fa-wrench" style="color:#f87171;"></i> STRUMENTI MANCANTI`;
        } else if (isQuantityValid) {
          craftBtn.disabled = false;
          craftBtn.innerHTML = activeCraftingMode === 'weapon_gem' ? `<i class="fa-solid fa-gem"></i> ESEGUI GEMME (+${match.expReward || 25} EXP)` : `<i class="fa-solid fa-hammer"></i> FABBRICA OGGETTO (+${match.expReward || 25} EXP)`;
        } else {
          resLbl.innerText = "Quantità Insufficiente";
          craftBtn.disabled = true;
          craftBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#f87171;"></i> MATERIALI INSUFFICIENTI`;
        }
      } else {
        resSlot.classList.remove('filled');
        resSlot.innerHTML = `<i class="fa-solid fa-question" style="font-size: 24px; color: #64748b;"></i>`;
        resSlot.oncontextmenu = null;
        resLbl.innerText = selectedSlots[0] && selectedSlots[1] ? "Nessuna Ricetta" : "In attesa...";
        craftBtn.disabled = true;
        craftBtn.innerHTML = activeCraftingMode === 'weapon_gem' ? `<i class="fa-solid fa-gem"></i> ESEGUI GEMME` : `<i class="fa-solid fa-hammer"></i> FABBRICA OGGETTO`;
        if (badgeContainer) badgeContainer.innerHTML = "";
        if (riskWarningContainer) riskWarningContainer.innerHTML = "";
      }
    }
  }

  function renderInventory() {
    const invList = root.querySelector('#fvtt-inv-list');
    if (!invList) return;
    const searchVal = (root.querySelector('#fvtt-inv-search')?.value || '').toLowerCase();
    invList.innerHTML = '';

    const items = getActorInventory().filter(i => i.name.toLowerCase().includes(searchVal));

    if (items.length === 0) {
      invList.innerHTML = `<div style="font-size:11px; color:#64748b; text-align:center; padding:12px;">Nessun oggetto nell'inventario.</div>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'fvtt-item-card';
      card.draggable = true;
      
      const qtyBadge = item.quantity > 1 
        ? `<span style="font-size:11px; font-weight:bold; color:#f59e0b; background:#020617; padding:2px 6px; border-radius:8px; border:1px solid #f59e0b;">x${item.quantity}</span>` 
        : '';

      card.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
            <img src="${item.img}" style="width:30px; height:30px; border-radius:6px; object-fit:cover;">
            <span style="font-size:12px; color:#f3f4f6; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${item.name}</span>
          </div>
          ${qtyBadge}
        </div>
      `;

      card.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, name: item.name, img: item.img, uuid: item.uuid, type: item.type }));
      };

      card.onclick = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        addItemToSlots(item);
      };
      invList.appendChild(card);
    });
  }

  function addItemToSlots(item) {
    if (activeCraftingMode === 'repair' || activeCraftingMode === 'coating') {
      if (item.type === 'weapon') {
        selectedSlots[0] = item;
      } else {
        selectedSlots[1] = item;
      }
    } else if (activeCraftingMode === 'weapon_gem') {
      if (!selectedSlots[0]) selectedSlots[0] = item;
      else if (!selectedSlots[1]) selectedSlots[1] = item;
      else fillSecondarySlots(item);
    } else {
      const specialFull = isSpecialJob && isSpecialFullCraftingMode(activeCraftingMode);
      if (!selectedSlots[0]) selectedSlots[0] = item;
      else if (!selectedSlots[1]) selectedSlots[1] = item;
      else if (specialFull || activeCraftingMode === 'pro' || activeCraftingMode === 'mst' || activeCraftingMode === 'dark_art') {
        if (!selectedSlots[2]) selectedSlots[2] = item;
        else fillSecondarySlots(item);
      } else {
        fillSecondarySlots(item);
      }
    }
    updateSlotsUI();
  }

  function fillSecondarySlots(item) {
    const specialFull = isSpecialJob && isSpecialFullCraftingMode(activeCraftingMode);

    // Nei Job Speciali Standard/Avanzato/Professionale/Master/Arti Oscure
    // sono sempre disponibili 5 reagenti, 3 catalizzatori e 1 Energia Arcana.
    const emptyReagent = reagentSlots.findIndex(r => r === null);
    if (emptyReagent !== -1) { reagentSlots[emptyReagent] = item; return; }

    if (specialFull || activeCraftingMode === 'pro' || activeCraftingMode === 'mst' || activeCraftingMode === 'dark_art') {
      const emptyCat = catalystSlots.findIndex(c => c === null);
      if (emptyCat !== -1) { catalystSlots[emptyCat] = item; return; }
    }

    if (specialFull || activeCraftingMode === 'mst') {
      const maxArcane = specialFull ? 1 : arcaneSlots.length;
      for (let i = 0; i < maxArcane; i++) {
        if (arcaneSlots[i] === null) { arcaneSlots[i] = item; return; }
      }
    }

    if (activeCraftingMode === 'dark_art' && hasDarkArt) {
      const emptyDark = darkSlots.findIndex(d => d === null);
      if (emptyDark !== -1) { darkSlots[emptyDark] = item; return; }
    }
    selectedSlots[0] = item;
  }

  [0, 1, 2].forEach(idx => {
    const slotEl = root.querySelector(`#fvtt-slot-${idx}`);
    if (!slotEl) return;

    slotEl.onclick = (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (selectedSlots[idx] !== null) {
        selectedSlots[idx] = null;
        updateSlotsUI();
      } else {
        showInventoryPicker((item) => {
          if ((activeCraftingMode === 'repair' || activeCraftingMode === 'coating' || activeCraftingMode === 'weapon_gem') && idx === 0 && item.type !== 'weapon') {
            ui.notifications.warn("Devi inserire un'arma nello slot principale!");
            return;
          }
          selectedSlots[idx] = item;
          updateSlotsUI();
        });
      }
    };

    slotEl.ondragover = (e) => { e.preventDefault(); slotEl.classList.add('drag-over'); };
    slotEl.ondragleave = () => slotEl.classList.remove('drag-over');
    slotEl.ondrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      slotEl.classList.remove('drag-over');
      try {
        const rawData = e.dataTransfer.getData("text/plain");
        if (!rawData) return;
        const data = JSON.parse(rawData);
        let itemObj = null;
        if (data.uuid) {
          const doc = await fromUuid(data.uuid);
          if (doc) itemObj = { id: doc.id, name: doc.name, uuid: doc.uuid, img: doc.img, type: doc.type };
        } else if (data.name) {
          itemObj = { id: data.id, name: data.name, uuid: null, img: data.img || "icons/svg/item-bag.svg", type: data.type || "unknown" };
        }
        if (itemObj) {
          if ((activeCraftingMode === 'repair' || activeCraftingMode === 'coating' || activeCraftingMode === 'weapon_gem') && idx === 0 && itemObj.type !== 'weapon') {
            ui.notifications.warn("Devi inserire un'arma nel primo slot!");
            return;
          }
          selectedSlots[idx] = itemObj;
          updateSlotsUI();
        }
      } catch(err) { console.error(err); }
    };
  });

  [0, 1, 2, 3, 4].forEach(rIdx => {
    const rSlotEl = root.querySelector(`#fvtt-reagent-${rIdx}`);
    if (!rSlotEl) return;

    rSlotEl.onclick = (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (reagentSlots[rIdx] !== null) {
        reagentSlots[rIdx] = null;
        updateSlotsUI();
      } else {
        showInventoryPicker((item) => {
          reagentSlots[rIdx] = item;
          updateSlotsUI();
        });
      }
    };

    rSlotEl.ondragover = (e) => { e.preventDefault(); rSlotEl.classList.add('drag-over'); };
    rSlotEl.ondragleave = () => rSlotEl.classList.remove('drag-over');
    rSlotEl.ondrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      rSlotEl.classList.remove('drag-over');
      try {
        const rawData = e.dataTransfer.getData("text/plain");
        if (!rawData) return;
        const data = JSON.parse(rawData);
        let itemObj = null;
        if (data.uuid) {
          const doc = await fromUuid(data.uuid);
          if (doc) itemObj = { id: doc.id, name: doc.name, uuid: doc.uuid, img: doc.img, type: doc.type };
        } else if (data.name) {
          itemObj = { id: data.id, name: data.name, uuid: null, img: data.img || "icons/svg/item-bag.svg", type: data.type || "unknown" };
        }
        if (itemObj) {
          reagentSlots[rIdx] = itemObj;
          updateSlotsUI();
        }
      } catch(err) { console.error(err); }
    };
  });

  catalystSlots.forEach((_, cIdx) => {
    const cSlotEl = root.querySelector(`#fvtt-catalyst-${cIdx}`);
    if (!cSlotEl) return;

    cSlotEl.onclick = (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (catalystSlots[cIdx] !== null) {
        catalystSlots[cIdx] = null;
        updateSlotsUI();
      } else {
        showInventoryPicker((item) => {
          catalystSlots[cIdx] = item;
          updateSlotsUI();
        });
      }
    };

    cSlotEl.ondragover = (e) => { e.preventDefault(); cSlotEl.classList.add('drag-over'); };
    cSlotEl.ondragleave = () => cSlotEl.classList.remove('drag-over');
    cSlotEl.ondrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      cSlotEl.classList.remove('drag-over');
      try {
        const rawData = e.dataTransfer.getData("text/plain");
        if (!rawData) return;
        const data = JSON.parse(rawData);
        let itemObj = null;
        if (data.uuid) {
          const doc = await fromUuid(data.uuid);
          if (doc) itemObj = { id: doc.id, name: doc.name, uuid: doc.uuid, img: doc.img, type: doc.type };
        } else if (data.name) {
          itemObj = { id: data.id, name: data.name, uuid: null, img: data.img || "icons/svg/item-bag.svg", type: data.type || "unknown" };
        }
        if (itemObj) {
          catalystSlots[cIdx] = itemObj;
          updateSlotsUI();
        }
      } catch(err) { console.error(err); }
    };
  });

  arcaneSlots.forEach((_, aIdx) => {
    const aSlotEl = root.querySelector(`#fvtt-arcane-${aIdx}`);
    if (!aSlotEl) return;

    aSlotEl.onclick = (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (arcaneSlots[aIdx] !== null) {
        arcaneSlots[aIdx] = null;
        updateSlotsUI();
      } else {
        showInventoryPicker((item) => {
          arcaneSlots[aIdx] = item;
          updateSlotsUI();
        });
      }
    };

    aSlotEl.ondragover = (e) => { e.preventDefault(); aSlotEl.classList.add('drag-over'); };
    aSlotEl.ondragleave = () => aSlotEl.classList.remove('drag-over');
    aSlotEl.ondrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      aSlotEl.classList.remove('drag-over');
      try {
        const rawData = e.dataTransfer.getData("text/plain");
        if (!rawData) return;
        const data = JSON.parse(rawData);
        let itemObj = null;
        if (data.uuid) {
          const doc = await fromUuid(data.uuid);
          if (doc) itemObj = { id: doc.id, name: doc.name, uuid: doc.uuid, img: doc.img, type: doc.type };
        } else if (data.name) {
          itemObj = { id: data.id, name: data.name, uuid: null, img: data.img || "icons/svg/item-bag.svg", type: data.type || "unknown" };
        }
        if (itemObj) {
          arcaneSlots[aIdx] = itemObj;
          updateSlotsUI();
        }
      } catch(err) { console.error(err); }
    };
  });

  [0, 1, 2, 3, 4].forEach(dIdx => {
    const dSlotEl = root.querySelector(`#fvtt-dark-slot-${dIdx}`);
    if (!dSlotEl) return;

    dSlotEl.onclick = (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (darkSlots[dIdx] !== null) {
        darkSlots[dIdx] = null;
        updateSlotsUI();
      } else {
        showInventoryPicker((item) => {
          darkSlots[dIdx] = item;
          updateSlotsUI();
        });
      }
    };

    dSlotEl.ondragover = (e) => { e.preventDefault(); dSlotEl.classList.add('drag-over'); };
    dSlotEl.ondragleave = () => dSlotEl.classList.remove('drag-over');
    dSlotEl.ondrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dSlotEl.classList.remove('drag-over');
      try {
        const rawData = e.dataTransfer.getData("text/plain");
        if (!rawData) return;
        const data = JSON.parse(rawData);
        let itemObj = null;
        if (data.uuid) {
          const doc = await fromUuid(data.uuid);
          if (doc) itemObj = { id: doc.id, name: doc.name, uuid: doc.uuid, img: doc.img, type: doc.type };
        } else if (data.name) {
          itemObj = { id: data.id, name: data.name, uuid: null, img: data.img || "icons/svg/item-bag.svg", type: data.type || "unknown" };
        }
        if (itemObj) {
          darkSlots[dIdx] = itemObj;
          updateSlotsUI();
        }
      } catch(err) { console.error(err); }
    };
  });

  const quickFillBtn = root.querySelector('#fvtt-btn-quick-fill');
  if (quickFillBtn) {
    quickFillBtn.onclick = (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      openQuickFillDialog();
    };
  }

  function openQuickFillDialog() {
    const availableRecipes = recipes.filter(r => {
      const type = getRecipeType(r);
      const isDarkRecipe = type === 'dark_art' || (r.darkReagents && r.darkReagents.length > 0);
      
      if (isDarkRecipe && !hasDarkArt) return false;
      if (jobStats.level < (r.requiredLevel || 1)) return false;
      // Le ricette segrete non compaiono ai player finché non sono state scoperte manualmente.
      if (r.secret && !isSecretRecipeDiscovered(r)) return false;

      return true;
    });

    if (availableRecipes.length === 0) {
      ui.notifications.warn(isSpecialJob ? "Nessuna ricetta disponibile o sbloccata per le stelle attuali." : "Nessuna ricetta disponibile o sbloccata per questo livello.");
      return;
    }

    let contentHtml = `
      <div style="padding:10px; background:#0f172a; color:#f3f4f6; max-height:350px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
        ${availableRecipes.map(r => {
          const calcRate = calculateDynamicSuccessRate(r, actor, [null, null, null], [1,1,1], [null, null, null, null, null], [1,1,1,1,1], [null, null], [1,1], [null, null], [1,1], [null, null, null, null, null], [1,1,1,1,1], [ [null, null, null], [null, null], [null] ]);
          const isRepair = r.type === 'repair' || r.isRepair;
          const isCoating = r.type === 'coating' || r.isCoating;
          const isWeaponGem = isWeaponGemRecipe(r);
          
          let ingPreviewText = r.ing1 + ' + ' + r.ing2;
          if (isRepair) ingPreviewText = 'Riparazione Arma';
          if (isCoating) ingPreviewText = `Applicazione: ${r.ing2} (Lustro: +${r.coatingLustro || 100})`;
          if (isWeaponGem) ingPreviewText = getWeaponGemPreviewText(r);

          const recipeIcon = getRecipeDefaultIcon(r, selectedSlots[0]);
          const recipeTitle = r.customName || r.result;
          const secretBadge = r.secret
            ? (isGM
                ? `<span style="font-size:8px;color:#fecaca;border:1px solid #ef4444;background:rgba(127,29,29,.35);border-radius:8px;padding:1px 5px;margin-left:4px;"><i class="fa-solid fa-user-shield"></i> SEGRETA • DM</span>`
                : `<span style="font-size:8px;color:#fde68a;border:1px solid #f59e0b;background:rgba(120,53,15,.28);border-radius:8px;padding:1px 5px;margin-left:4px;"><i class="fa-solid fa-lock-open"></i> SEGRETA SCOPERTA</span>`)
            : ``;

          return `
            <div class="fvtt-item-card quick-fill-row" data-id="${r.id}" title="Click per caricare la ricetta nel banco" style="display:flex; justify-content:space-between; align-items:center; padding:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <img src="${recipeIcon}" style="width:28px; height:28px; border-radius:4px; object-fit:cover;">
                <div>
                  <div style="font-weight:bold; color:#f59e0b; font-size:12px;">${recipeTitle} ${secretBadge} ${isSpecialJob ? `(Richiede ${'⭐'.repeat(Math.clamp(r.requiredLevel || 1,1,5))})` : `(Lv. ${r.requiredLevel || 1})`}</div>
                  <div style="font-size:10px; color:#94a3b8;">${ingPreviewText}</div>
                </div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end;">
                <span style="font-size:10px; color:${isSpecialJob ? '#facc15' : '#38bdf8'};">${isSpecialJob ? `Prestigio +${r.prestigeReward || 0}` : `EXP +${r.expReward || 25}`}</span>
                ${isRepair || isCoating ? `<span style="font-size:9px; font-weight:bold; color:#10b981;">🎯 100% Sicuro</span>` : `<span style="font-size:9px; font-weight:bold; color:${calcRate >= 100 ? '#fbbf24' : (calcRate >= 71 ? '#10b981' : (calcRate >= 50 ? '#94a3b8' : '#ef4444'))};">🎯 ${calcRate}% Base</span>`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    renderUniversalDialog({
      title: `Carica Ricetta Sbloccata (${jobTitle})`,
      content: contentHtml,
      width: 380,
      height: 400,
      renderCB: (qRoot, qDialog) => {
        qRoot.querySelectorAll('.quick-fill-row').forEach(row => {
          const recId = row.getAttribute('data-id');
          const rec = recipes.find(r => r.id === recId);

          row.addEventListener('click', () => {
            if (rec) {
              clearAndResetSlots();
              activeLoadedRecipeId = rec.id;

              const inv = getActorInventory();
              const findInv = (name) => inv.find(i => i.name.toLowerCase().trim() === name?.toLowerCase().trim()) || { id: null, name, img: "icons/svg/item-bag.svg", type: "unknown" };

              const isRepair = rec.type === 'repair' || rec.isRepair;
              const isCoating = rec.type === 'coating' || rec.isCoating;
              const isWeaponGem = rec.type === 'weapon_gem' || rec.isWeaponGem;
              
              if (isRepair) {
                setCraftingMode('repair');
                let targetWeapon = inv.find(i => {
                   if (i.type !== 'weapon') return false;
                   const cur = i.flags?.["foundry-weapon-system"]?.durability?.current ?? 100;
                   const max = i.flags?.["foundry-weapon-system"]?.durability?.max ?? 100;
                   return cur < max;
                }) || inv.find(i => i.type === 'weapon');

                if (targetWeapon) { selectedSlots[0] = targetWeapon; selectedQty[0] = 1; } 
                else { ui.notifications.warn("Nessun'arma trovata nell'inventario per la riparazione."); }
                
                if (rec.ing2) { selectedSlots[1] = findInv(rec.ing2); selectedQty[1] = rec.qty2 || 1; }
              } else if (isWeaponGem) {
                setCraftingMode('weapon_gem');

                // Carica automaticamente SOLO un'arma realistica compatibile con la rarità
                // richiesta dalla ricetta. Prima veniva presa la prima arma dell'inventario,
                // facendo sembrare Foratura/Incastonatura non funzionanti per Rare/Legendary ecc.
                let targetWeapon = inv.find(i => {
                  if (i.type !== 'weapon' || !i.flags?.["foundry-weapon-system"]?.isRealistic) return false;
                  const doc = actor.items.get(i.id);
                  return weaponMatchesRecipeRarity(rec, doc || i);
                });

                if (targetWeapon) {
                  selectedSlots[0] = targetWeapon;
                  selectedQty[0] = 1;
                } else {
                  const rarityLabel = rec.weaponRarity ? getWeaponRarityLabel(rec.weaponRarity) : null;
                  ui.notifications.warn(rarityLabel
                    ? `Nessuna arma realistica di rarità ${rarityLabel} trovata nell'inventario.`
                    : "Nessun'arma realistica trovata nell'inventario per il crafting gemme!");
                }
                if (rec.ing2) { selectedSlots[1] = findInv(rec.ing2); selectedQty[1] = rec.qty2 || 1; }
              } else if (isCoating) {
                setCraftingMode('coating');
                let targetWeapon = inv.find(i => i.type === 'weapon' && i.flags?.["foundry-weapon-system"]?.isRealistic);
                
                if (targetWeapon) { selectedSlots[0] = targetWeapon; selectedQty[0] = 1; }
                else { ui.notifications.warn("Nessun'arma realistica trovata nel tuo inventario per applicare il rivestimento!"); }

                if (rec.ing2) {
                  selectedSlots[1] = findInv(rec.ing2);
                  selectedQty[1] = rec.qty2 || 1;
                }
              } else {
                setCraftingMode(rec.type || 'std');
                if (rec.ing1) { selectedSlots[0] = findInv(rec.ing1); selectedQty[0] = rec.qty1 || 1; }
                if (rec.ing2) { selectedSlots[1] = findInv(rec.ing2); selectedQty[1] = rec.qty2 || 1; }
                if (rec.ing3) { selectedSlots[2] = findInv(rec.ing3); selectedQty[2] = rec.qty3 || 1; }
              }

              if (rec.reagents) {
                rec.reagents.forEach((reg, i) => {
                  const name = typeof reg === 'string' ? reg : reg.name;
                  const qty = typeof reg === 'string' ? 1 : (reg.qty || 1);
                  if (name && i < 5) { reagentSlots[i] = findInv(name); reagentQty[i] = qty; }
                });
              }

              if (rec.catalysts) {
                rec.catalysts.forEach((cat, i) => {
                  const name = typeof cat === 'string' ? cat : cat.name;
                  const qty = typeof cat === 'string' ? 1 : (cat.qty || 1);
                  if (name && i < catalystSlots.length) { catalystSlots[i] = findInv(name); catalystQty[i] = qty; }
                });
              }

              if (rec.arcanes) {
                rec.arcanes.forEach((arc, i) => {
                  const name = typeof arc === 'string' ? arc : arc.name;
                  const qty = typeof arc === 'string' ? 1 : (arc.qty || 1);
                  if (name && i < arcaneSlots.length) { arcaneSlots[i] = findInv(name); arcaneQty[i] = qty; }
                });
              }

              const darkList = rec.darkReagents || [];
              if (darkList && hasDarkArt) {
                darkList.forEach((drk, i) => {
                  const name = typeof drk === 'string' ? drk : drk.name;
                  const qty = typeof drk === 'string' ? 1 : (drk.qty || 1);
                  if (name && i < 5) { darkSlots[i] = findInv(name); darkQty[i] = qty; }
                });
              }

              if (rec.tools) {
                rec.tools.forEach((slotTools, sIdx) => {
                  if (Array.isArray(slotTools)) {
                    slotTools.forEach((t, tIdx) => {
                      if (t && t.name && toolSlots[sIdx]) {
                        toolSlots[sIdx][tIdx] = findInv(t.name);
                      }
                    });
                  }
                });
              }

              renderToolSlots();
              updateSlotsUI();
              ui.notifications.info(`Ricetta "${rec.customName || rec.result}" caricata nel banco da lavoro!`);
            }
            if (qDialog && typeof qDialog.close === 'function') qDialog.close();
          });
        });
      }
    });
  }

  const clearBtn = root.querySelector('#fvtt-clear-slots');
  if (clearBtn) {
    clearBtn.onclick = (e) => {
      e?.preventDefault();
      clearAndResetSlots();
    };
  }

  async function processExtraMaterials(match) {
      if (match.reagents && match.reagents.length > 0) {
        for (let i = 0; i < match.reagents.length; i++) {
          const reg = match.reagents[i];
          const regName = typeof reg === 'string' ? reg : reg.name;
          if (reagentSlots[i] && reagentSlots[i].name.toLowerCase() === regName.toLowerCase()) {
            const regQty = reagentQty[i] || (typeof reg === 'string' ? 1 : (reg.qty || 1));
            await consumeActorItemQuantity(actor, regName, regQty);
          }
        }
      }
      reagentSlots.forEach((r, i) => {
        if (r !== null) {
          const alreadyConsumed = match.reagents?.some(reg => {
            const name = typeof reg === 'string' ? reg : reg.name;
            return name.toLowerCase() === r.name.toLowerCase();
          });
          if (!alreadyConsumed) {
            consumeActorItemQuantity(actor, r.name, reagentQty[i] || 1);
          }
        }
      });

      if (match.catalysts && match.catalysts.length > 0) {
        for (let i = 0; i < match.catalysts.length; i++) {
          const cat = match.catalysts[i];
          const catName = typeof cat === 'string' ? cat : cat.name;
          if (catalystSlots[i] && catalystSlots[i].name.toLowerCase() === catName.toLowerCase()) {
            const catQty = catalystQty[i] || (typeof cat === 'string' ? 1 : (cat.qty || 1));
            await consumeActorItemQuantity(actor, catName, catQty);
          }
        }
      }
      catalystSlots.forEach((c, i) => {
        if (c !== null) {
          const alreadyConsumed = match.catalysts?.some(cat => {
            const name = typeof cat === 'string' ? cat : cat.name;
            return name.toLowerCase() === c.name.toLowerCase();
          });
          if (!alreadyConsumed) {
            consumeActorItemQuantity(actor, c.name, catalystQty[i] || 1);
          }
        }
      });

      if (match.arcanes && match.arcanes.length > 0) {
        for (let i = 0; i < match.arcanes.length; i++) {
          const arc = match.arcanes[i];
          const arcName = typeof arc === 'string' ? arc : arc.name;
          if (arcaneSlots[i] && arcaneSlots[i].name.toLowerCase() === arcName.toLowerCase()) {
            const arcQty = arcaneQty[i] || (typeof arc === 'string' ? 1 : (arc.qty || 1));
            await consumeActorItemQuantity(actor, arcName, arcQty);
          }
        }
      }

      const darkList = match.darkReagents || [];
      if (darkList && darkList.length > 0 && hasDarkArt) {
        for (let i = 0; i < darkList.length; i++) {
          const drk = match.darkReagents[i];
          const drkName = typeof drk === 'string' ? drk : drk.name;
          if (darkSlots[i] && darkSlots[i].name.toLowerCase() === drkName.toLowerCase()) {
            const drkQty = darkQty[i] || (typeof drk === 'string' ? 1 : (drk.qty || 1));
            await consumeActorItemQuantity(actor, drkName, drkQty);
          }
        }
      }
  }

  const doCraftBtn = root.querySelector('#fvtt-btn-do-craft');
  if (doCraftBtn) {
    doCraftBtn.onclick = async (e) => {
      e?.preventDefault();
      const match = findRecipeMatch();
      if (!match) return;
      const secretUnknownAtAttempt = isUndiscoveredSecretRecipe(match);

      if (match.type === 'repair' || match.isRepair) {
        const reqQty2 = match.qty2 || 1;
        if (getActorItemQuantity(actor, selectedSlots[1].name) < reqQty2) {
          ui.notifications.error("Materiale di riparazione insufficiente!");
          return;
        }

        const weaponItem = actor.items.get(selectedSlots[0]?.id) || actor.items.find(i => i.name.toLowerCase() === selectedSlots[0].name.toLowerCase());

        if (weaponItem && weaponItem.type === "weapon") {
          let weaponFlags = weaponItem.flags?.["foundry-weapon-system"];
          const currentDur = weaponFlags?.durability?.current ?? 50;
          const maxDur = weaponFlags?.durability?.max ?? 100;

          if (currentDur >= maxDur) {
            ui.notifications.warn("Quest'arma è già in perfette condizioni!");
            return;
          }

          await consumeActorItemQuantity(actor, selectedSlots[1].name, reqQty2);
          await processExtraMaterials(match);

          const repairAmount = match.repairAmount || 50;
          const newDur = Math.min(maxDur, currentDur + repairAmount);

          await weaponItem.update({
            "flags.foundry-weapon-system": {
              durability: { current: newDur, max: maxDur },
              lustro: weaponFlags?.lustro || 0,
              affinity: weaponFlags?.affinity || "none"
            }
          });

          await unlockSecretRecipeAfterSuccess(match);

          const expReward = isSpecialJob ? 0 : (match.expReward || 15);
          const prestigeReward = match.prestigeReward || 0;
          const updatedStats = await addActorJobExp(actor, jobKey, jobTitle, expReward, prestigeReward);
          jobStats.level = updatedStats.level;
          jobStats.exp = updatedStats.exp;
          jobStats.prestige = updatedStats.prestige;

          updateExpBarUI();

          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `🛠️ <b>${actor.name}</b> ha riparato con successo l'arma <b style="color:#10b981;">${weaponItem.name}</b> ripristinandone la durabilità a ${newDur}/${maxDur}.${isSpecialJob ? (prestigeReward ? ` (+${prestigeReward} Prestigio)` : ``) : ` (+${expReward} EXP)`}`
          });

          ui.notifications.info(`✨ ${weaponItem.name} riparata con successo! (+${repairAmount} Durabilità)`);
        } else {
          ui.notifications.error("Impossibile trovare l'arma da riparare nell'inventario.");
        }

        clearAndResetSlots();
        return;
      }

      if (match.type === 'coating' || match.isCoating) {
        if (jobStats.level < (match.requiredLevel || 1)) {
          ui.notifications.error(isSpecialJob ? `Stelle insufficienti! Richieste ${match.requiredLevel || 1} stelle.` : `Livello insufficiente! Richiesto Livello ${match.requiredLevel || 1}.`);
          return;
        }

        const coatingItem = selectedSlots[1];
        const coatingName = coatingItem.name;
        const reqCoatQty = match.qty2 || 1;
        if (getActorItemQuantity(actor, coatingName) < reqCoatQty) {
          ui.notifications.error("Materiale di rivestimento insufficiente nell'inventario!");
          return;
        }

        const weaponItem = actor.items.get(selectedSlots[0]?.id) || actor.items.find(i => i.name.toLowerCase() === selectedSlots[0].name.toLowerCase());
        if (!weaponItem || weaponItem.type !== "weapon" || !weaponItem.flags?.["foundry-weapon-system"]?.isRealistic) {
           ui.notifications.error("Devi inserire un'arma realistica nel primo slot!");
           return;
        }

        let realCoatingDoc = actor.items.get(coatingItem.id) || actor.items.find(i => i.name.toLowerCase().trim() === coatingName.toLowerCase().trim());
        
        if (!realCoatingDoc) {
          const packObj = game.packs.get("craftingsystem.Oggetti");
          if (packObj) {
            const index = await packObj.getIndex();
            const compItemInfo = index.find(i => i.name.toLowerCase().trim() === coatingName.toLowerCase().trim());
            if (compItemInfo) {
              realCoatingDoc = await packObj.getDocument(compItemInfo._id);
            }
          }
        }

        const coatingEffects = realCoatingDoc?.effects ? Array.from(realCoatingDoc.effects).map(e => e.toObject()) : [];
        const coatingImg = realCoatingDoc?.img || coatingItem.img;
        const assignedLustro = match.coatingLustro !== undefined ? match.coatingLustro : 100;

        await consumeActorItemQuantity(actor, coatingName, reqCoatQty);
        await processExtraMaterials(match);

        if (game.weaponSystem?.applyCoatingToWeapon) {
          await game.weaponSystem.applyCoatingToWeapon(weaponItem, coatingName, coatingImg, coatingEffects, realCoatingDoc);
        }

        await weaponItem.update({
          "flags.foundry-weapon-system.lustro": assignedLustro
        });

        await unlockSecretRecipeAfterSuccess(match);

        const expReward = isSpecialJob ? 0 : (match.expReward || 40);
        const prestigeReward = match.prestigeReward || 0;
        const updatedStats = await addActorJobExp(actor, jobKey, jobTitle, expReward, prestigeReward);
        jobStats.level = updatedStats.level;
        jobStats.exp = updatedStats.exp;
        jobStats.prestige = updatedStats.prestige;

        updateExpBarUI();

        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `🛠️ <b>${actor.name}</b> ha applicato con successo <b>${coatingName}</b> su <b style="color:#10b981;">${weaponItem.name}</b>! (Lustro impostato a ${assignedLustro})${isSpecialJob ? (prestigeReward ? ` (+${prestigeReward} Prestigio)` : ``) : ` (+${expReward} EXP)`}`
        });

        ui.notifications.info(`✨ Rivestimento applicato con successo su ${weaponItem.name} (Lustro: ${assignedLustro})!${isSpecialJob ? (prestigeReward ? ` (+${prestigeReward} Prestigio)` : ``) : ` (+${expReward} EXP)`}`);
        clearAndResetSlots();
        return;
      }

      if (match.type === 'weapon_gem' || match.isWeaponGem) {
        if (jobStats.level < (match.requiredLevel || 1)) {
          ui.notifications.error(isSpecialJob ? `Stelle insufficienti! Richieste ${match.requiredLevel || 1} stelle.` : `Livello insufficiente! Richiesto Livello ${match.requiredLevel || 1}.`);
          return;
        }

        const weaponItem = actor.items.get(selectedSlots[0]?.id) || actor.items.find(i => i.name.toLowerCase() === selectedSlots[0].name.toLowerCase());
        if (!weaponItem || weaponItem.type !== 'weapon' || !weaponItem.flags?.['foundry-weapon-system']?.isRealistic) {
          ui.notifications.error("Devi inserire un\'arma realistica nel primo slot!");
          return;
        }

        if (!weaponMatchesRecipeRarity(match, weaponItem)) {
          ui.notifications.error(`Rarità arma non valida: questa ricetta richiede ${getWeaponRarityLabel(match.weaponRarity)}.`);
          return;
        }

        if (!selectedSlots[1]) {
          ui.notifications.error("Inserisci l\'oggetto / gemma specifico nel secondo slot!");
          return;
        }

        const action = getWeaponGemActiveAction(match);
        const targetSlotIdx = getWeaponGemSlotIndex(match);
        const reqQty2 = match.qty2 || 1;
        const secondName = selectedSlots[1].name;

        const weaponFlags = weaponItem.flags?.['foundry-weapon-system'] || {};
        const currentDrilled = weaponFlags.drilledSlots || [false, false, false];
        const currentLost = weaponFlags.lostSlots || [false, false, false];
        const currentGemSlots = weaponFlags.gemSlots || [null, null, null];
        while (currentDrilled.length < 3) currentDrilled.push(false);
        while (currentLost.length < 3) currentLost.push(false);
        while (currentGemSlots.length < 3) currentGemSlots.push(null);

        // --- DIALOGO DI CONFERMA ---
        const successRate = calculateDynamicSuccessRate(match, actor, selectedSlots, selectedQty, reagentSlots, reagentQty, catalystSlots, catalystQty, arcaneSlots, arcaneQty, darkSlots, darkQty, toolSlots);
        const confirm = await new Promise((resolve) => {
          const dialogContent = `
            <div style="padding:14px; background:#0f172a; color:#f3f4f6; text-align:center;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size:36px; color:#f87171; margin-bottom:8px;"></i>
              <h3 style="color:#f59e0b; margin:0 0 8px 0;">Attenzione: Operazione ad Alto Rischio</h3>
              <p style="font-size:12px; color:#cbd5e1; line-height:1.4;">
                ${secretUnknownAtAttempt
                  ? `Stai tentando una <b>ricetta segreta non ancora scoperta</b> su <b>${weaponItem.name}</b>.`
                  : `Stai per eseguire un'operazione di <b>${getWeaponGemActionLabel(action)}</b> su <b>${weaponItem.name}</b>.`}
                <br><br>
                <span style="color:#f87171;">⚠️ In caso di fallimento:</span>
                ${secretUnknownAtAttempt
                  ? '<br>- L\'operazione può distruggere materiali o danneggiare il bersaglio.'
                  : (action === 'drill' ? '<br>- Lo slot verrà distrutto permanentemente.<br>- La durabilità massima dell\'arma diminuirà.' : '<br>- La gemma si frantumerà e andrà persa.')}
                <br><br>
                Probabilità di successo: <b style="color:#38bdf8;">${secretUnknownAtAttempt ? '???' : successRate + '%'}</b>
              </p>
              <div style="display:flex; gap:8px; justify-content:center; margin-top:10px;">
                <button type="button" id="confirm-proceed" class="fvtt-weapon-btn" style="background:#10b981 !important; border-color:#34d399 !important;">Sì, procedi</button>
                <button type="button" id="confirm-cancel" class="fvtt-weapon-btn" style="background:#ef4444 !important; border-color:#f87171 !important;">Annulla</button>
              </div>
            </div>
          `;
          renderUniversalDialog({
            title: `Conferma Operazione Gemme`,
            content: dialogContent,
            width: 400,
            height: 280,
            renderCB: (rootD, dialog) => {
              rootD.querySelector('#confirm-proceed').onclick = () => { resolve(true); dialog.close(); };
              rootD.querySelector('#confirm-cancel').onclick = () => { resolve(false); dialog.close(); };
            }
          });
        });

        if (!confirm) {
          ui.notifications.info("Operazione annullata.");
          return;
        }

        const consumeSecond = async () => {
          if (getActorItemQuantity(actor, secondName) >= reqQty2) {
            await consumeActorItemQuantity(actor, secondName, reqQty2);
          }
        };

        if (action === 'drill') {
          const currentLevel = weaponFlags.level || 1;
          const availableSlotIdx = [0, 1, 2].find(idx => {
            const reqLvl = idx === 0 ? 2 : idx === 1 ? 4 : 6;
            return currentLevel >= reqLvl && !currentDrilled[idx] && !currentLost[idx];
          });

          if (availableSlotIdx === undefined) {
            ui.notifications.warn("Non ci sono slot liberi e forabili su quest'arma.");
            return;
          }

          const reqLvl = availableSlotIdx === 0 ? 2 : availableSlotIdx === 1 ? 4 : 6;
          if (currentLevel < reqLvl) {
            ui.notifications.error(`Questo slot richiede un'arma di almeno Livello ${reqLvl}.`);
            return;
          }

          // La Foratura usa ESATTAMENTE la percentuale mostrata dal crafting.
          // La vecchia regola manuale slot + rarità (getDrillSuccessRate) non partecipa più al tiro.
          const drillSuccessRate = successRate;
          const roll = Math.floor(Math.random() * 100) + 1;
          const success = roll <= drillSuccessRate;
          const rollDetailsText = `Tiro d100: ${roll} vs ${drillSuccessRate}%`;

          await consumeSecond();
          await processExtraMaterials(match);

          if (success) {
            currentDrilled[availableSlotIdx] = true;
            await weaponItem.update({ 'flags.foundry-weapon-system.drilledSlots': currentDrilled });
            await unlockSecretRecipeAfterSuccess(match);
            ui.notifications.info(`✨ Slot ${availableSlotIdx + 1} forato con successo (${rollDetailsText})!`);
            ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor }),
              content: `🔧 <b>${actor.name}</b> ha praticato con successo un foro nello Slot ${availableSlotIdx + 1} dell'arma <b>${weaponItem.name}</b>.<br><i>Risultato: ${rollDetailsText} — Successo!</i>`
            });
          } else {
            currentLost[availableSlotIdx] = true;
            const lostCount = currentLost.filter(Boolean).length;
            const penalty = getWeaponGemFailurePenalty(lostCount);
            let baseMax = weaponFlags.baseMaxDurability;
            if (baseMax === undefined) {
              baseMax = weaponFlags.durability?.max || 100;
              await weaponItem.update({ 'flags.foundry-weapon-system.baseMaxDurability': baseMax });
            }
            const newMax = Math.max(1, baseMax - penalty);
            const currentDurObj = weaponFlags.durability || { current: 100, max: 100 };
            const newCur = Math.min(currentDurObj.current ?? 100, newMax);
            await weaponItem.update({
              'flags.foundry-weapon-system.lostSlots': currentLost,
              'flags.foundry-weapon-system.durability.max': newMax,
              'flags.foundry-weapon-system.durability.current': newCur
            });
            ui.notifications.error(`💥 Foratura Slot ${availableSlotIdx + 1} fallita! Slot distrutto e durabilità ridotta.`);
            ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor }),
              content: `💥 <b>Disastro nella foratura per ${actor.name}!</b> Il tentativo di forare lo Slot ${availableSlotIdx + 1} di <b>${weaponItem.name}</b> è fallito:<br>- Lo slot è <b style="color:#ef4444;">perso per sempre</b>.<br>- Totale slot rotti: <b>${lostCount}</b>. L'arma ha perso permanentemente punti di durabilità massima (Nuovo Max: ${newMax}).<br><i>Risultato: ${rollDetailsText}</i>`
            });
          }

          const updatedStats = await addActorJobExp(actor, jobKey, jobTitle, isSpecialJob ? 0 : (match.expReward || 25), match.prestigeReward || 0);
          jobStats.level = updatedStats.level;
          jobStats.exp = updatedStats.exp;
          jobStats.prestige = updatedStats.prestige;
          updateExpBarUI();
          clearAndResetSlots();
          return;
        }

        const targetGem = selectedSlots[1];
        const targetGemName = targetGem.name;
        const targetGemQty = reqQty2;
        const roll = Math.floor(Math.random() * 100) + 1;
        const success = roll <= successRate;
        const rollDetailsText = `Tiro d100: ${roll} vs ${successRate}%`;

        await consumeSecond();
        await processExtraMaterials(match);

        if (action === 'insert') {
          if (success) {
            currentGemSlots[targetSlotIdx] = { name: targetGemName, img: targetGem.img || 'icons/svg/item-bag.svg', uuid: targetGem.uuid || null };
            await weaponItem.update({ 'flags.foundry-weapon-system.gemSlots': currentGemSlots });

            const gemDoc = targetGem.uuid ? await fromUuid(targetGem.uuid) : null;
            const gemEffects = gemDoc?.effects ? Array.from(gemDoc.effects).map(e => e.toObject()) : [];
            if (gemEffects.length > 0) {
              const effectsToCreate = gemEffects.map(e => {
                const ef = foundry.utils.duplicate(e);
                ef.origin = weaponItem.uuid;
                ef.disabled = false;
                ef.transfer = true;
                ef._id = foundry.utils.randomID();
                ef.flags = ef.flags || {};
                ef.flags['foundry-weapon-system'] = { isGemEffect: true, gemName: targetGemName };
                return ef;
              });
              await weaponItem.createEmbeddedDocuments('ActiveEffect', effectsToCreate);
            }

            await unlockSecretRecipeAfterSuccess(match);
            ui.notifications.info(`✨ Gemma "${targetGemName}" incastonata con successo (${rollDetailsText})!`);
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `💎 <b>${actor.name}</b> ha incastonato la gemma <b style="color:#10b981;">${targetGemName}</b> in <b>${weaponItem.name}</b>.<br><i>Risultato: ${rollDetailsText} — Successo!</i>` });
          } else {
            ui.notifications.error(`💥 Incastonatura fallita (${rollDetailsText})! La gemma si è frantumata.`);
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `💥 <b>Incastonatura fallita per ${actor.name}!</b> La gemma <b>${targetGemName}</b> si è <b style="color:#ef4444;">frantumata</b> in <b>${weaponItem.name}</b>.<br><i>Risultato: ${rollDetailsText} — Fallimento!</i>` });
            await addGemFragmentsToActor(actor, 1);
          }
        } else if (action === 'remove') {
          if (!currentGemSlots[targetSlotIdx]) {
            ui.notifications.warn("Nessuna gemma presente nello slot bersaglio.");
            return;
          }
          const gemObj = currentGemSlots[targetSlotIdx];
          currentGemSlots[targetSlotIdx] = null;
          await weaponItem.update({ 'flags.foundry-weapon-system.gemSlots': currentGemSlots });

          const gemEffects = weaponItem.effects.filter(e => e.flags?.['foundry-weapon-system']?.isGemEffect && e.flags['foundry-weapon-system'].gemName === gemObj.name);
          if (gemEffects.length > 0) {
            await weaponItem.deleteEmbeddedDocuments('ActiveEffect', gemEffects.map(e => e.id));
          }

          if (success) {
            if (gemObj.uuid) {
              const gemDoc = await fromUuid(gemObj.uuid);
              if (gemDoc) {
                const existing = actor.items.find(i => i.name.toLowerCase().trim() === gemObj.name.toLowerCase().trim());
                if (existing) {
                  await existing.update({ 'system.quantity': (existing.system?.quantity || 1) + 1 });
                } else {
                  await actor.createEmbeddedDocuments('Item', [gemDoc.toObject()]);
                }
              }
            }
            await unlockSecretRecipeAfterSuccess(match);
            ui.notifications.info(`✨ Gemma "${gemObj.name}" rimossa con successo (${rollDetailsText}) e restituita.`);
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `💎 <b>${actor.name}</b> ha rimosso la gemma <b style="color:#10b981;">${gemObj.name}</b> da <b>${weaponItem.name}</b>.<br><i>Risultato: ${rollDetailsText} — Successo!</i>` });
          } else {
            ui.notifications.error(`💥 Rimozione fallita (${rollDetailsText})! La gemma si è frantumata.`);
            ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `💥 <b>Rimozione fallita per ${actor.name}!</b> La gemma <b>${gemObj.name}</b> si è <b style="color:#ef4444;">frantumata</b> durante l'estrazione da <b>${weaponItem.name}</b>.<br><i>Risultato: ${rollDetailsText} — Fallimento!</i>` });
            await addGemFragmentsToActor(actor, 1);
          }
        }

        const updatedStats = await addActorJobExp(actor, jobKey, jobTitle, isSpecialJob ? 0 : (match.expReward || 25), match.prestigeReward || 0);
        jobStats.level = updatedStats.level;
        jobStats.exp = updatedStats.exp;
        jobStats.prestige = updatedStats.prestige;
        updateExpBarUI();
        clearAndResetSlots();
        return;
      }
      if (jobStats.level < (match.requiredLevel || 1)) {
        ui.notifications.error(isSpecialJob ? `Stelle insufficienti! Richieste ${match.requiredLevel || 1} stelle.` : `Livello insufficiente! Richiesto Livello ${match.requiredLevel || 1}.`);
        return;
      }

      const req1 = selectedQty[0] || match.qty1 || 1;
      const req2 = selectedQty[1] || match.qty2 || 1;
      const req3 = selectedQty[2] || match.qty3 || 1;

      if (getActorItemQuantity(actor, selectedSlots[0].name) < req1 ||
          getActorItemQuantity(actor, selectedSlots[1].name) < req2 ||
          (selectedSlots[2] && getActorItemQuantity(actor, selectedSlots[2].name) < req3)) {
        ui.notifications.error("Quantità dei materiali principali insufficiente!");
        return;
      }

      await consumeActorItemQuantity(actor, selectedSlots[0].name, req1);
      await consumeActorItemQuantity(actor, selectedSlots[1].name, req2);
      if (selectedSlots[2]) await consumeActorItemQuantity(actor, selectedSlots[2].name, req3);

      await processExtraMaterials(match);

      const finalSuccessRate = calculateDynamicSuccessRate(match, actor, selectedSlots, selectedQty, reagentSlots, reagentQty, catalystSlots, catalystQty, arcaneSlots, arcaneQty, darkSlots, darkQty, toolSlots);
      const roll = Math.floor(Math.random() * 100) + 1;

      if (roll > finalSuccessRate) {
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: secretUnknownAtAttempt
            ? `💥 <b>${actor.name}</b> ha tentato una <b>ricetta sconosciuta</b> ma ha <b style="color:#ef4444;">FALLITO</b>! Tutti i materiali impiegati sono andati distrutti.`
            : `💥 <b>${actor.name}</b> ha tentato di fabbricare <b>${match.result}</b> ma ha <b style="color:#ef4444;">FALLITO</b>! (Tiro: ${roll}% vs Probabilità: ${finalSuccessRate}%). Tutti i materiali impiegati sono andati distrutti!`
        });

        ui.notifications.error(secretUnknownAtAttempt
          ? `💥 Crafting Fallito! La ricetta resta sconosciuta e i materiali sono andati distrutti.`
          : `💥 Crafting Fallito! (Tiro ${roll}% vs ${finalSuccessRate}%). I materiali sono andati distrutti.`);
        clearAndResetSlots();
        return;
      }

      let resultData = null;
      if (match.resultUuid) {
        const compDoc = await fromUuid(match.resultUuid);
        if (compDoc) resultData = compDoc.toObject();
      }

      if (!resultData) {
        resultData = {
          name: match.result,
          type: "equipment",
          img: match.resultImg || "icons/svg/item-bag.svg"
        };
      }

      await actor.createEmbeddedDocuments("Item", [resultData]);
      await unlockSecretRecipeAfterSuccess(match);

      const expReward = isSpecialJob ? 0 : (match.expReward || 25);
      const prestigeReward = match.prestigeReward || 0;
      
      const updatedStats = await addActorJobExp(actor, jobKey, jobTitle, expReward, prestigeReward);
      jobStats.level = updatedStats.level;
      jobStats.exp = updatedStats.exp;
      jobStats.prestige = updatedStats.prestige;

      updateExpBarUI();

      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `🛠️ <b>${actor.name}</b> ha fabbricato con successo (<span style="color:#f59e0b;">${jobTitle}</span>) <b style="color: #10b981;">${match.result}</b>! (Tiro: ${roll}% vs ${finalSuccessRate}%)${isSpecialJob ? (prestigeReward > 0 ? ` (+${prestigeReward} Prestigio)` : ``) : ` (+${expReward} EXP ${prestigeReward > 0 ? '| +' + prestigeReward + ' Prestige' : ''})`}`
      });

      ui.notifications.info(`✨ Fabbricato con successo: ${match.result}${isSpecialJob ? (prestigeReward > 0 ? ` (+${prestigeReward} Prestigio)` : ``) : ` (+${expReward} EXP)`}`);
      clearAndResetSlots();
    };
  }

  function renderCompendiumList() {
    const compList = root.querySelector('#fvtt-comp-list');
    if (!compList) return;
    const searchVal = (root.querySelector('#fvtt-comp-search')?.value || '').toLowerCase();
    const packFilterVal = root.querySelector('#fvtt-comp-pack-filter')?.value || 'all';
    compList.innerHTML = '';

    const items = compendiumItems.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(searchVal);
      const matchPack = packFilterVal === 'all' || i.pack === packFilterVal;
      return matchSearch && matchPack;
    });

    items.slice(0, 80).forEach(item => {
      const card = document.createElement('div');
      card.className = 'fvtt-item-card';
      card.draggable = true;
      card.title = "Click SX: Apri Scheda | Click DX: Crea Ricetta";
      card.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${item.img}" style="width:30px; height:30px; border-radius:6px; object-fit:cover;">
            <div>
              <div style="font-size:12px; font-weight:bold; color:#f3f4f6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;">${item.name}</div>
              <div style="font-size:10px; color:#94a3b8;">${item.packTitle}</div>
            </div>
          </div>
          <i class="fa-solid fa-plus-circle" style="color:#10b981; font-size:16px;"></i>
        </div>
      `;

      card.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ id: item.id, name: item.name, img: item.img, uuid: item.uuid }));
      };

      card.addEventListener('click', async (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        const doc = await fromUuid(item.uuid);
        if (doc) doc.sheet.render(true);
      });

      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openNewRecipeDialog(item);
      });

      compList.appendChild(card);
    });
  }

  const compSearch = root.querySelector('#fvtt-comp-search');
  const compFilter = root.querySelector('#fvtt-comp-pack-filter');
  const invSearch = root.querySelector('#fvtt-inv-search');
  if (invSearch) invSearch.addEventListener('input', renderInventory);
  if (compSearch) compSearch.addEventListener('input', renderCompendiumList);
  if (compFilter) compFilter.addEventListener('change', renderCompendiumList);

  const filterAll = root.querySelector('#fvtt-rec-filter-all');
  const filterLevel = root.querySelector('#fvtt-rec-filter-level');

  function setRecipeFilter(type, btn, e) {
    e?.preventDefault();
    e?.stopPropagation();
    recipeFilter = type;
    if (filterAll) {
      if (type === 'all') filterAll.classList.add('active');
      else filterAll.classList.remove('active');
    }
    renderRecipeList();
  }

  if (filterAll) filterAll.addEventListener('click', (e) => setRecipeFilter('all', filterAll, e));
  if (filterLevel) {
    filterLevel.addEventListener('change', (e) => {
      recipeLevelFilter = e.target.value;
      if (recipeLevelFilter !== 'all' && filterAll) filterAll.classList.remove('active');
      renderRecipeList();
    });
  }

  function typeLabel(t) {
    if (t === 'adv') return 'Avanzata';
    if (t === 'pro') return 'Professionale';
    if (t === 'mst') return 'Master';
    if (t === 'dark_art') return 'Arti oscure';
    if (t === 'weapon_gem') return 'Forature & Gemme';
    if (t === 'repair') return 'Riparazione';
    if (t === 'coating') return 'Rivestimento';
    return 'Standard';
  }

  function renderRecipeList() {
    const grid = root.querySelector('#fvtt-recipes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filteredRecipes = recipes.filter(r => {
      const type = getRecipeType(r);
      const reqLvl = r.requiredLevel || 1;

      const matchType = recipeFilter === 'all' || type === recipeFilter;
      const matchLevel = recipeLevelFilter === 'all' || reqLvl.toString() === recipeLevelFilter.toString();

      return matchType && matchLevel;
    });

    if (filteredRecipes.length === 0) {
      grid.innerHTML = `<div style="grid-column: span 2; text-align:center; color:#64748b; padding:20px;">Nessuna ricetta trovata in questa categoria/requisito.</div>`;
      return;
    }

    filteredRecipes.forEach((r) => {
      const realIndex = recipes.indexOf(r);
      const card = document.createElement('div');
      card.className = 'fvtt-item-card';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.padding = '10px';

      const isRepair = r.type === 'repair' || r.isRepair;
      const isCoating = r.type === 'coating' || r.isCoating;
      const isWeaponGem = isWeaponGemRecipe(r);
      
      const qty1 = r.qty1 || 1;
      const qty2 = r.qty2 || 1;
      const qty3 = r.qty3 || 1;
      const reqLv = r.requiredLevel || 1;
      const expRew = r.expReward || 25;
      const presRew = r.prestigeReward || 0;
      const baseRate = r.baseSuccessRate !== undefined ? r.baseSuccessRate : (r.successRate !== undefined ? r.successRate : 100);

      let ingText = `${qty1}x ${r.ing1} + ${qty2}x ${r.ing2}${r.ing3 ? ' + ' + qty3 + 'x ' + r.ing3 : ''}`;
      if (isRepair) ingText = `Qualsiasi Arma + ${qty2}x ${r.ing2}`;
      if (isCoating) ingText = `Arma Realistica + ${qty2}x ${r.ing2 || 'Rivestimento'} (Lustro: +${r.coatingLustro || 100})`;
      if (isWeaponGem) ingText = `${getWeaponGemPreviewText(r)} | Arma Realistica + ${qty2}x ${r.ing2 || 'Oggetto Specifico'}`;

      const previewIconPath = getRecipeDefaultIcon(r);
      const previewImg = `<img src="${previewIconPath}" style="width:42px; height:42px; border-radius:8px; object-fit:cover; border:1px solid #f59e0b;">`;

      const displayTitle = r.customName || r.result;
      const secretManagerBadge = r.secret
        ? `<span style="font-size:8px;color:#fecaca;border:1px solid #ef4444;background:rgba(127,29,29,.32);border-radius:8px;padding:1px 5px;margin-left:5px;"><i class="fa-solid fa-user-secret"></i> SEGRETA</span>`
        : ``;

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; padding-right:6px;">
          <input type="checkbox" class="recipe-select-checkbox" data-index="${realIndex}" style="width:16px; height:16px; cursor:pointer;">
        </div>
        <div style="flex-grow:1; padding-right:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size: 13px; font-weight: bold; color: #f59e0b;">${displayTitle}${secretManagerBadge}</span>
            <div style="display:flex; gap:6px;">
              <button type="button" class="edit-recipe-btn fvtt-btn" style="padding:2px 6px; font-size:10px;" title="Modifica"><i class="fa-solid fa-pen"></i></button>
              <button type="button" class="delete-recipe-btn fvtt-btn" style="padding:2px 6px; font-size:10px; background:#ef4444 !important; border-color:#f87171 !important;" title="Elimina"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <div style="font-size:10px; color:#38bdf8; font-weight:bold; margin-top:2px;">Tipo: ${typeLabel(r.type || type)} | ${isSpecialJob ? `Stelle richieste: ${'⭐'.repeat(Math.clamp(reqLv,1,5))} (${reqLv})` : `Livello: ${reqLv} | EXP: +${expRew}`} ${presRew ? '| Prestigio +' + presRew : ''} ${!isRepair && !isCoating ? `| 🎯 Base ${baseRate}%` : ''}</div>
          <div style="color: #f3f4f6; margin-top:2px; font-size:11px;"><b>Ingr:</b> ${ingText}</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; shrink-0;" title="Clicca col destro per aprire la scheda">
          ${previewImg}
          <span style="font-size:9px; color:#94a3b8; margin-top:2px; font-weight:bold;">${isRepair ? 'Riparazione' : (isCoating ? 'Rivestimento' : (isWeaponGem ? 'Forature/Gemme' : 'Prodotto'))}</span>
        </div>
      `;

      card.querySelector('.edit-recipe-btn').addEventListener('click', (e) => { e?.preventDefault(); e?.stopPropagation(); openNewRecipeDialog(null, r, realIndex); });
      card.querySelector('.delete-recipe-btn').addEventListener('click', async (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        recipes.splice(realIndex, 1);
        await actor.setFlag("world", flagName, recipes);
        renderRecipeList();
        ui.notifications.info("Ricetta eliminata!");
      });

      grid.appendChild(card);
    });
  }

  const exportBtn = root.querySelector('#fvtt-btn-export-json');
  if (exportBtn) {
    exportBtn.addEventListener('click', async (e) => {
      e?.preventDefault();
      e?.stopPropagation();

      const checkboxes = root.querySelectorAll('.recipe-select-checkbox');
      const selectedIndices = [];
      checkboxes.forEach(cb => {
        if (cb.checked) selectedIndices.push(parseInt(cb.getAttribute('data-index')));
      });

      if (selectedIndices.length === 0) {
        ui.notifications.warn("⚠️ Seleziona almeno una ricetta spuntando la casella corrispondente per esportarla!");
        return;
      }

      const recipesToExport = selectedIndices.map(idx => recipes[idx]).filter(Boolean);
      const jsonContent = JSON.stringify(recipesToExport, null, 2);

      if (window.showSaveFilePicker) {
        try {
          const options = {
            suggestedName: `ricette_${jobKey}_${actor.name}.json`,
            types: [{
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            }],
          };
          const handle = await window.showSaveFilePicker(options);
          const writable = await handle.createWritable();
          await writable.write(jsonContent);
          await writable.close();
          ui.notifications.info(`Esportate con successo ${recipesToExport.length} ricette!`);
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn("File System Access API fallito", err);
          } else {
            return; 
          }
        }
      }

      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `ricette_${jobKey}_${actor.name}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      ui.notifications.info(`Esportate con successo ${recipesToExport.length} ricette!`);
    });
  }

  const importBtn = root.querySelector('#fvtt-btn-import-json');
  const fileInput = root.querySelector('#fvtt-json-file-input');
  if (importBtn && fileInput) {
    importBtn.addEventListener('click', (e) => {
      e?.preventDefault();
      e?.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedRecipes = JSON.parse(event.target.result);
          if (Array.isArray(importedRecipes)) {
            importedRecipes.forEach(impRec => {
              const existingIdx = recipes.findIndex(r => r.id === impRec.id || r.result.toLowerCase() === impRec.result.toLowerCase());
              if (existingIdx !== -1) {
                recipes[existingIdx] = impRec;
              } else {
                recipes.push(impRec);
              }
            });

            await actor.setFlag("world", flagName, recipes);
            renderRecipeList();
            ui.notifications.info(`Importate/Aggiornate con successo le ricette dal file!`);
          } else {
            ui.notifications.error("Il file JSON non è valido.");
          }
        } catch (err) {
          console.error(err);
          ui.notifications.error("Errore durante la lettura del file JSON.");
        }
      };
      reader.readAsText(file);
      fileInput.value = ""; 
    });
  }

  function openNewRecipeDialog(prefilledResult = null, recipeToEdit = null, editIndex = -1) {
    let modeType = recipeToEdit ? (recipeToEdit.type || (recipeToEdit.weaponGemAction ? 'weapon_gem' : 'std')) : 'std';

    let recipeData = { 
      customName: recipeToEdit ? (recipeToEdit.customName || "") : "",
      secret: recipeToEdit ? !!recipeToEdit.secret : false,
      ing1: recipeToEdit && recipeToEdit.type !== 'repair' && recipeToEdit.type !== 'coating' ? { name: recipeToEdit.ing1, uuid: null, img: "icons/svg/item-bag.svg" } : null,
      qty1: recipeToEdit ? (recipeToEdit.qty1 || 1) : 1, 
      ing2: recipeToEdit && recipeToEdit.ing2 ? { name: recipeToEdit.ing2, uuid: null, img: recipeToEdit.resultImg || "icons/svg/item-bag.svg" } : null, 
      qty2: recipeToEdit ? (recipeToEdit.qty2 || 1) : 1, 
      ing3: recipeToEdit && recipeToEdit.ing3 ? { name: recipeToEdit.ing3, uuid: null, img: "icons/svg/item-bag.svg" } : null, 
      qty3: recipeToEdit ? (recipeToEdit.qty3 || 1) : 1, 
      requiredLevel: recipeToEdit ? (recipeToEdit.requiredLevel || 1) : 1,
      expReward: isSpecialJob ? 0 : (recipeToEdit ? (recipeToEdit.expReward || 25) : 25),
      prestigeReward: recipeToEdit ? (recipeToEdit.prestigeReward || 0) : 0,
      baseSuccessRate: recipeToEdit ? (recipeToEdit.baseSuccessRate !== undefined ? recipeToEdit.baseSuccessRate : (recipeToEdit.successRate || 100)) : 100,
      bonusPerExtraMain: recipeToEdit ? (recipeToEdit.bonusPerExtraMain !== undefined ? recipeToEdit.bonusPerExtraMain : (recipeToEdit.bonusPerExtraQty || 0)) : 0,
      bonusPerExtraReagent: recipeToEdit ? (recipeToEdit.bonusPerExtraReagent !== undefined ? recipeToEdit.bonusPerExtraReagent : (recipeToEdit.bonusPerReagent || 0)) : 0,
      bonusPerExtraCatalyst: recipeToEdit ? (recipeToEdit.bonusPerExtraCatalyst || 0) : 0,
      bonusPerExtraArcane: recipeToEdit ? (recipeToEdit.bonusPerExtraArcane || 0) : 0,
      bonusPerExtraDark: recipeToEdit ? (recipeToEdit.bonusPerExtraDark || 0) : 0,
      bonusPerTool: recipeToEdit ? (recipeToEdit.bonusPerTool || 0) : 0,
      maxSuccessRate: recipeToEdit ? (recipeToEdit.maxSuccessRate || 100) : 100,
      repairAmount: recipeToEdit ? (recipeToEdit.repairAmount || 50) : 50,
      coatingLustro: recipeToEdit ? (recipeToEdit.coatingLustro || 100) : 100,
      weaponGemAction: recipeToEdit ? (recipeToEdit.weaponGemAction || recipeToEdit.gemAction || 'drill') : 'drill',
      targetGemSlot: recipeToEdit ? (recipeToEdit.targetGemSlot || recipeToEdit.weaponGemSlot || 1) : 1,
      weaponRarity: recipeToEdit ? (recipeToEdit.weaponRarity || 'common') : 'common',
      tools: recipeToEdit?.tools || (isSpecialJob ? [[null,null],[null,null],[null,null]] : [[null,null,null],[null,null],[null]]),
      reagents: recipeToEdit && recipeToEdit.reagents 
        ? [0,1,2,3,4].map(i => {
            const reg = recipeToEdit.reagents[i];
            if (!reg) return null;
            return typeof reg === 'string' ? { name: reg, qty: 1, uuid: null, img: "icons/svg/item-bag.svg" } : { name: reg.name, qty: reg.qty || 1, uuid: null, img: "icons/svg/item-bag.svg" };
          }) 
        : [null, null, null, null, null],
      catalysts: recipeToEdit && recipeToEdit.catalysts
        ? (isSpecialJob ? [0,1,2] : [0,1]).map(i => {
            const cat = recipeToEdit.catalysts[i];
            if (!cat) return null;
            return typeof cat === 'string' ? { name: cat, qty: 1, uuid: null, img: "icons/svg/item-bag.svg" } : { name: cat.name, qty: cat.qty || 1, uuid: null, img: "icons/svg/item-bag.svg" };
          })
        : (isSpecialJob ? [null, null, null] : [null, null]),
      arcanes: recipeToEdit && recipeToEdit.arcanes
        ? [0,1].map(i => {
            const arc = recipeToEdit.arcanes[i];
            if (!arc) return null;
            return typeof arc === 'string' ? { name: arc, qty: 1, uuid: null, img: "icons/svg/item-bag.svg" } : { name: arc.name, qty: arc.qty || 1, uuid: null, img: "icons/svg/item-bag.svg" };
          })
        : [null, null],
      darkReagents: recipeToEdit && recipeToEdit.darkReagents
        ? [0,1,2,3,4].map(i => {
            const drk = recipeToEdit.darkReagents[i];
            if (!drk) return null;
            return typeof drk === 'string' ? { name: drk, qty: 1, uuid: null, img: "icons/svg/item-bag.svg" } : { name: drk.name, qty: drk.qty || 1, uuid: null, img: "icons/svg/item-bag.svg" };
          })
        : [null, null, null, null, null],
      result: prefilledResult 
        ? { name: prefilledResult.name, uuid: prefilledResult.uuid, img: prefilledResult.img } 
        : (recipeToEdit && recipeToEdit.type !== 'repair' && recipeToEdit.type !== 'coating' ? { name: recipeToEdit.result, uuid: recipeToEdit.resultUuid, img: recipeToEdit.resultImg } : null) 
    };

    if (isSpecialJob) {
      recipeData.requiredLevel = Math.clamp(recipeData.requiredLevel || 1, 1, 5);
      recipeData.expReward = 0;
      recipeData.tools = [0,1,2].map(i => [
        recipeData.tools?.[i]?.[0] || null,
        recipeData.tools?.[i]?.[1] || null
      ]);
      while (recipeData.catalysts.length < 3) recipeData.catalysts.push(null);
      while (recipeData.arcanes.length < 2) recipeData.arcanes.push(null);
    }

    // Forzatura per le ricette di gemme
    if (modeType === 'weapon_gem') {
      recipeData.ing1 = { name: "Arma Realistica", uuid: null, img: "icons/svg/anvil.svg" };
      recipeData.qty1 = 1;
      recipeData.result = null; // verrà generato al salvataggio
    }

    const recipeDialogHtml = `
      <div style="padding:12px; color:#f3f4f6; max-height:560px; overflow-y:auto;">
        
        ${isSpecialJob ? `<div style="margin-bottom:10px; padding:8px 10px; border-radius:8px; border:1px solid #7c3aed; background:rgba(124,58,237,.12); color:#ddd6fe; font-size:10px; font-weight:bold;"><i class="fa-solid fa-star"></i> EDITOR RICETTA JOB SPECIALE • Standard 1⭐ • Avanzata 2⭐ • Professionale 3⭐ • Master 5⭐ • 3 Slot • 2 Strumenti/Slot • 5 Reagenti • 3 Catalizzatori • 1 Energia Arcana</div>` : ''}
        <div style="margin-bottom:10px; background:#020617; padding:8px; border-radius:8px; border:1px solid #334155;">
          <label style="font-size:11px; font-weight:bold; color:#f59e0b; display:block; margin-bottom:4px;"><i class="fa-solid fa-pen-to-square"></i> Nome Personalizzato Ricetta (Opzionale):</label>
          <input type="text" id="recipe-custom-name" value="${recipeData.customName}" placeholder="Es: Riparazione Avanzata, Rivestimento Magico d'Oro..." class="fvtt-input" style="width:100%;">
        </div>

        <div style="margin-bottom:10px; background:rgba(127,29,29,.22); padding:9px 10px; border-radius:8px; border:1px solid #b91c1c;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;color:#fecaca;font-size:11px;font-weight:800;">
            <input type="checkbox" id="recipe-secret" ${recipeData.secret ? 'checked' : ''} style="width:17px;height:17px;accent-color:#dc2626;">
            <i class="fa-solid fa-user-secret"></i> Ricetta Segreta
          </label>
          <div style="margin-top:4px;font-size:9px;color:#fca5a5;line-height:1.3;">
            Il DM può vederla e caricarla sempre. I giocatori non la vedono in <b>Carica</b> finché non la completano manualmente con successo.
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#1e293b; padding:8px; border-radius:8px; border:1px solid #334155;">
          <span style="font-weight:bold; color:#f59e0b; font-size:12px;">Tipo Ricetta:</span>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button type="button" id="rec-mode-std" class="fvtt-btn ${modeType === 'std' ? 'active' : ''}" style="background:#059669 !important; border-color:#34d399 !important;">${isSpecialJob ? '⭐ Standard' : 'Standard'}</button>
            <button type="button" id="rec-mode-adv" class="fvtt-btn ${modeType === 'adv' ? 'active' : ''}" style="background:#0284c7 !important; border-color:#38bdf8 !important;">${isSpecialJob ? '⭐⭐ Avanzata' : 'Avanzata'}</button>
            <button type="button" id="rec-mode-pro" class="fvtt-btn ${modeType === 'pro' ? 'active' : ''}" style="background:#7c3aed !important; border-color:#c084fc !important;">${isSpecialJob ? '⭐⭐⭐ Professionale' : 'Professionale'}</button>
            <button type="button" id="rec-mode-mst" class="fvtt-btn ${modeType === 'mst' ? 'active' : ''}" style="background:#ea580c !important; border-color:#fb923c !important;">${isSpecialJob ? '⭐⭐⭐⭐⭐ Master' : 'Master'}</button>
            <button type="button" id="rec-mode-dark" class="fvtt-btn ${modeType === 'dark_art' ? 'active' : ''}" style="background:#9f1239 !important; border-color:#f43f5e !important;">Arti oscure</button>
            <button type="button" id="rec-mode-weapon-gem" class="fvtt-btn ${modeType === 'weapon_gem' ? 'active' : ''}" style="background:#0f766e !important; border-color:#2dd4bf !important;">Forature & Gemme</button>
            <button type="button" id="rec-mode-repair" class="fvtt-btn ${modeType === 'repair' ? 'active' : ''}" style="background:#475569 !important; border-color:#94a3b8 !important;">Riparazione</button>
            <button type="button" id="rec-mode-coating" class="fvtt-btn ${modeType === 'coating' ? 'active' : ''}" style="background:#ca8a04 !important; border-color:#facc15 !important;">Rivestimento</button>
          </div>
        </div>

        <div id="rec-rules-container" style="display: ${modeType === 'repair' || modeType === 'coating' ? 'none' : 'block'}; margin-bottom:10px; background:#020617; padding:8px; border-radius:8px; border:1px solid #334155;">
          <div style="font-size:11px; font-weight:bold; color:#10b981; margin-bottom:6px;"><i class="fa-solid fa-bullseye"></i> Calcolo Probabilità di Successo (%)</div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
            <div>
              <label style="font-size:9px; color:#94a3b8; display:block;">🎯 Base Successo (%):</label>
              <input type="number" id="recipe-base-success" min="1" max="100" value="${recipeData.baseSuccessRate}" class="fvtt-input" style="width:100%;">
            </div>
            <div>
              <label style="font-size:9px; color:#94a3b8; display:block;">🔝 Capping Max (%):</label>
              <input type="number" id="recipe-max-success" min="1" max="100" value="${recipeData.maxSuccessRate}" class="fvtt-input" style="width:100%;">
            </div>
            <div>
              <label style="font-size:9px; color:#94a3b8; display:block;">📦 Bonus Materiali Princ. Extra (+%/u):</label>
              <input type="number" id="recipe-bonus-extra-main" min="0" max="50" value="${recipeData.bonusPerExtraMain}" class="fvtt-input" style="width:100%;">
            </div>
            <div>
              <label style="font-size:9px; color:#94a3b8; display:block;">🧪 Bonus Reagenti Extra (+%/u):</label>
              <input type="number" id="recipe-bonus-extra-reagent" min="0" max="50" value="${recipeData.bonusPerExtraReagent}" class="fvtt-input" style="width:100%;">
            </div>
            <div>
              <label style="font-size:9px; color:#94a3b8; display:block;">⚗️ Bonus Catalizzatori Extra (+%/u):</label>
              <input type="number" id="recipe-bonus-extra-catalyst" min="0" max="50" value="${recipeData.bonusPerExtraCatalyst}" class="fvtt-input" style="width:100%;">
            </div>
            <div>
              <label style="font-size:9px; color:#94a3b8; display:block;">⚡ Bonus Energia Arcana Extra (+%/u):</label>
              <input type="number" id="recipe-bonus-extra-arcane" min="0" max="50" value="${recipeData.bonusPerExtraArcane}" class="fvtt-input" style="width:100%;">
            </div>
            <div>
              <label style="font-size:9px; color:#94a3b8; display:block;">💀 Bonus Materiali Oscuri Extra (+%/u):</label>
              <input type="number" id="recipe-bonus-extra-dark" min="0" max="50" value="${recipeData.bonusPerExtraDark}" class="fvtt-input" style="width:100%;">
            </div>
            <div>
              <label style="font-size:9px; color:#94a3b8; display:block;">🔧 Bonus Strumento Equipaggiato (+%/str):</label>
              <input type="number" id="recipe-bonus-tool" min="0" max="50" value="${recipeData.bonusPerTool}" class="fvtt-input" style="width:100%;">
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: ${isSpecialJob ? '1fr 1fr' : '1fr 1fr 1fr'}; gap:8px; margin-bottom:10px; background:#020617; padding:8px; border-radius:8px; border:1px solid ${isSpecialJob ? '#6d28d9' : '#334155'};">
          <div>
            <label style="font-size:10px; font-weight:bold; color:${isSpecialJob ? '#c084fc' : '#38bdf8'}; display:block; margin-bottom:2px;">${isSpecialJob ? 'Stelle richieste (1-5):' : 'Livello (1-10):'}</label>
            <input type="number" id="recipe-req-level" min="1" max="${isSpecialJob ? 5 : 10}" value="${Math.clamp(recipeData.requiredLevel, 1, isSpecialJob ? 5 : 10)}" class="fvtt-input" style="width:100%;">
            ${isSpecialJob ? `<span id="recipe-star-auto-note" style="display:block;margin-top:3px;font-size:9px;color:#a78bfa;">Standard 1⭐ • Avanzato 2⭐ • Professionale 3⭐ • Master 5⭐</span>` : ''}
          </div>
          ${!isSpecialJob ? `<div>
            <label style="font-size:10px; font-weight:bold; color:#facc15; display:block; margin-bottom:2px;">EXP:</label>
            <input type="number" id="recipe-exp-reward" min="1" value="${recipeData.expReward}" class="fvtt-input" style="width:100%;">
          </div>` : ''}
          <div>
            <label style="font-size:10px; font-weight:bold; color:#fbbf24; display:block; margin-bottom:2px;">⭐ Punti Prestigio:</label>
            <input type="number" id="recipe-prestige-reward" min="0" value="${recipeData.prestigeReward}" class="fvtt-input" style="width:100%;">
          </div>
        </div>

        <div id="rec-repair-box" style="display: ${modeType === 'repair' ? 'block' : 'none'}; margin-bottom:10px; background:#020617; padding:8px; border-radius:8px; border:1px solid #334155;">
          <label style="font-weight:bold; color:#38bdf8; font-size:11px; display:block; margin-bottom:4px;">Punti Durabilità Riparati:</label>
          <input type="number" id="recipe-repair-amount" min="1" max="500" value="${recipeData.repairAmount || 50}" class="fvtt-input" style="width:100%;">
        </div>

        <!-- CAMPO LUSTRO PER I RIVESTIMENTI -->
        <div id="rec-coating-lustro-box" style="display: ${modeType === 'coating' ? 'block' : 'none'}; margin-bottom:10px; background:#020617; padding:8px; border-radius:8px; border:1px solid #facc15;">
          <label style="font-weight:bold; color:#facc15; font-size:11px; display:block; margin-bottom:4px;"><i class="fa-solid fa-wand-magic-sparkles"></i> Punti Lustro Conferiti all'Arma (1 - 100):</label>
          <input type="number" id="recipe-coating-lustro" min="1" max="100" value="${recipeData.coatingLustro || 100}" class="fvtt-input" style="width:100%;">
        </div>

        <div id="rec-mat1-container" style="display: ${modeType === 'coating' ? 'none' : 'block'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <label style="font-weight:bold; color:#f59e0b; font-size:11px;">${modeType === 'repair' ? '1° Materiale / Oggetto da Riparare:' : (modeType === 'weapon_gem' ? 'Arma Realistica (bloccata):' : '1° Materiale Principale:')}</label>
            ${modeType === 'weapon_gem'
              ? `<span class="fvtt-input" style="display:inline-flex; align-items:center; justify-content:center; width:50px; text-align:center; padding:6px 0; background:#020617; border:1px solid #334155; border-radius:6px; font-size:12px; font-weight:bold; color:#f59e0b;">1</span>`
              : `<input type="number" id="recipe-qty-1" min="1" value="${recipeData.qty1}" class="fvtt-input" style="width:50px; text-align:center;">`}
          </div>
          <div id="recipe-slot-ing1" class="recipe-drop-slot ${recipeData.ing1 ? 'filled' : ''} ${modeType === 'weapon_gem' ? 'disabled' : ''}">
            ${recipeData.ing1 ? `<img src="${recipeData.ing1.img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#f3f4f6; font-weight:bold; font-size:12px;">${recipeData.ing1.name}</span>` : `<span style="color:#f59e0b; font-size:11px; font-weight:bold;"><i class="fa-solid fa-hand-pointer"></i> ${modeType === 'repair' ? 'Qualsiasi Arma (Automatico)' : (modeType === 'weapon_gem' ? 'Qualsiasi Arma Realistica (Automatico)' : 'Clicca o Trascina 1° Materiale...')}</span>`}
          </div>

          <div style="margin-bottom:8px; background:#020617; padding:6px; border-radius:6px; border:1px solid #334155;">
            <label style="font-size:10px; font-weight:bold; color:#f59e0b; display:block; margin-bottom:4px;"><i class="fa-solid fa-wrench"></i> Strumenti Richiesti Slot 1 (Max ${isSpecialJob ? 2 : 3}):</label>
            <div style="display:flex; gap:8px;">
              ${(modeType === 'weapon_gem' ? [0] : ((isSpecialJob && !['repair','coating'].includes(modeType)) ? [0,1] : [0,1,2])).map(tIdx => {
                const tObj = recipeData.tools[0]?.[tIdx];
                return `<div id="rec-tool-0-${tIdx}" class="fvtt-tool-slot ${tObj ? 'filled' : ''}" style="width:32px; height:32px; font-size:12px;">
                  ${tObj ? `<img src="${tObj.img}" style="width:26px; height:26px; border-radius:4px;">` : `<i class="fa-solid fa-wrench"></i>`}
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div id="rec-mat2-container" style="display: block;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <label id="lbl-mat2" style="font-weight:bold; color:#f59e0b; font-size:11px;">${modeType === 'repair' ? 'Kit / Materiale di Riparazione:' : (modeType === 'coating' ? 'Materiale Rivestimento Specifico (Obbligatorio):' : (modeType === 'weapon_gem' ? 'Oggetto / Gemma Specifica:' : '2° Materiale:'))}</label>
            <input type="number" id="recipe-qty-2" min="1" value="${recipeData.qty2}" class="fvtt-input" style="width:50px; text-align:center;">
          </div>
          <div id="recipe-slot-ing2" class="recipe-drop-slot ${recipeData.ing2 ? 'filled' : ''}">
            ${recipeData.ing2 ? `<img src="${recipeData.ing2.img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#f3f4f6; font-weight:bold; font-size:12px;">${recipeData.ing2.name}</span>` : `<span style="color:#f59e0b; font-size:11px; font-weight:bold;"><i class="fa-solid fa-hand-pointer"></i> ${modeType === 'coating' ? 'Clicca o Trascina Materiale Rivestimento Obbligatorio...' : (modeType === 'weapon_gem' ? 'Clicca o Trascina Oggetto / Gemma Specifica...' : 'Clicca o Trascina Materiale...')}</span>`}
          </div>

          <div id="rec-tool2-container" style="display: block; margin-bottom:8px; background:#020617; padding:6px; border-radius:6px; border:1px solid #334155;">
            <label style="font-size:10px; font-weight:bold; color:#f59e0b; display:block; margin-bottom:4px;"><i class="fa-solid fa-wrench"></i> Strumenti Richiesti Slot 2 (Max 2):</label>
            <div style="display:flex; gap:8px;">
              ${(modeType === 'weapon_gem' ? [0] : [0,1]).map(tIdx => {
                const tObj = recipeData.tools[1]?.[tIdx];
                return `<div id="rec-tool-1-${tIdx}" class="fvtt-tool-slot ${tObj ? 'filled' : ''}" style="width:32px; height:32px; font-size:12px;">
                  ${tObj ? `<img src="${tObj.img}" style="width:26px; height:26px; border-radius:4px;">` : `<i class="fa-solid fa-wrench"></i>`}
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        <div id="rec-coating-msg" style="display: ${modeType === 'coating' ? 'block' : 'none'}; text-align:center; padding:12px; background:rgba(250, 204, 21, 0.1); border:1px solid #facc15; border-radius:8px; margin-bottom:10px;">
          <i class="fa-solid fa-layer-group" style="color:#facc15; font-size:24px; margin-bottom:6px;"></i>
          <p style="font-size:11px; color:#fef3c7; margin:0;"><b>Ricetta Rivestimento:</b> Verranno applicati automaticamente gli effetti dell'oggetto selezionato e impostato il Lustro stabilito.</p>
        </div>

        <div id="rec-weapon-gem-box" style="display: ${modeType === 'weapon_gem' ? 'block' : 'none'}; margin-bottom:10px; background:#02131f; padding:8px; border-radius:8px; border:1px solid #2dd4bf;">
          <label style="font-size:11px; font-weight:bold; color:#2dd4bf; display:block; margin-bottom:4px;"><i class="fa-solid fa-gem"></i> Operazione Gemme:</label>
          <select id="recipe-weapon-gem-action" class="fvtt-input" style="width:100%; margin-bottom:8px;">
            <option value="drill" ${recipeData.weaponGemAction === 'drill' ? 'selected' : ''}>Foratura</option>
            <option value="insert" ${recipeData.weaponGemAction === 'insert' ? 'selected' : ''}>Incastonatura</option>
            <option value="remove" ${recipeData.weaponGemAction === 'remove' ? 'selected' : ''}>Rimozione Gemma</option>
          </select>
          <div id="recipe-weapon-gem-auto-note" style="display:none; margin-bottom:8px; font-size:10px; color:#67e8f9; line-height:1.25; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.3); border-radius:6px; padding:6px 8px;"></div>
          <div id="recipe-weapon-gem-slot-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <div id="recipe-weapon-gem-slot-cell">
              <label style="font-size:10px; font-weight:bold; color:#38bdf8; display:block; margin-bottom:2px;">Slot bersaglio (1-3):</label>
              <input type="number" id="recipe-weapon-gem-slot" min="1" max="3" value="${recipeData.targetGemSlot}" class="fvtt-input" style="width:100%;">
            </div>
            <div id="recipe-weapon-rarity-cell">
              <label style="font-size:10px; font-weight:bold; color:#f59e0b; display:block; margin-bottom:2px;"><i class="fa-solid fa-gem"></i> Rarità arma richiesta:</label>
              <select id="recipe-weapon-rarity" class="fvtt-input" style="width:100%;">
                <option value="common" ${normalizeWeaponRarity(recipeData.weaponRarity) === 'common' ? 'selected' : ''}>Common</option>
                <option value="uncommon" ${normalizeWeaponRarity(recipeData.weaponRarity) === 'uncommon' ? 'selected' : ''}>Uncommon</option>
                <option value="rare" ${normalizeWeaponRarity(recipeData.weaponRarity) === 'rare' ? 'selected' : ''}>Rare</option>
                <option value="veryRare" ${normalizeWeaponRarity(recipeData.weaponRarity) === 'veryRare' ? 'selected' : ''}>Very Rare</option>
                <option value="legendary" ${normalizeWeaponRarity(recipeData.weaponRarity) === 'legendary' ? 'selected' : ''}>Legendary</option>
                <option value="artifact" ${normalizeWeaponRarity(recipeData.weaponRarity) === 'artifact' ? 'selected' : ''}>Artifact</option>
              </select>
            </div>
          </div>
          <div style="margin-top:6px; font-size:10px; color:#94a3b8; line-height:1.25;">
            Slot 1 = arma realistica della rarità scelta. Slot 2 = oggetto specifico definito nella ricetta.
          </div>
        </div>

        <div id="rec-slot-3-box" style="display: ${((isSpecialJob && !['weapon_gem','repair','coating'].includes(modeType)) || modeType === 'pro' || modeType === 'mst' || modeType === 'dark_art') ? 'block' : 'none'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
            <label style="font-weight:bold; color:#c084fc; font-size:11px;">3° Materiale:</label>
            <input type="number" id="recipe-qty-3" min="1" value="${recipeData.qty3}" class="fvtt-input" style="width:50px; text-align:center;">
          </div>
          <div id="recipe-slot-ing3" class="recipe-drop-slot ${recipeData.ing3 ? 'filled' : ''}" style="border-color:#a855f7;">
            ${recipeData.ing3 ? `<img src="${recipeData.ing3.img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#f3f4f6; font-weight:bold; font-size:12px;">${recipeData.ing3.name}</span>` : `<span style="color:#c084fc; font-size:11px; font-weight:bold;"><i class="fa-solid fa-hand-pointer"></i> Clicca o Trascina 3° Materiale...</span>`}
          </div>

          <div style="margin-bottom:8px; background:#020617; padding:6px; border-radius:6px; border:1px solid #334155;">
            <label style="font-size:10px; font-weight:bold; color:#c084fc; display:block; margin-bottom:4px;"><i class="fa-solid fa-wrench"></i> Strumenti Richiesti Slot 3 (Max ${isSpecialJob ? 2 : 1}):</label>
            <div style="display:flex; gap:8px;">
              ${(isSpecialJob ? [0,1] : [0]).map(tIdx => {
                const tObj = recipeData.tools[2]?.[tIdx];
                return `<div id="rec-tool-2-${tIdx}" class="fvtt-tool-slot ${tObj ? 'filled' : ''}" style="width:32px; height:32px; font-size:12px;">
                  ${tObj ? `<img src="${tObj.img}" style="width:26px; height:26px; border-radius:4px;">` : `<i class="fa-solid fa-wrench"></i>`}
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>

        ${isSpecialJob ? `<div id="rec-special-resources-note" style="display:${isSpecialFullCraftingMode(modeType) ? 'block' : 'none'}; margin-top:8px; padding:6px 8px; background:rgba(124,58,237,.10); border:1px solid rgba(167,139,250,.45); border-radius:7px; font-size:10px; color:#ddd6fe;"><i class="fa-solid fa-boxes-stacked"></i> Ricetta Job Speciale: 5 Reagenti • 3 Catalizzatori • 1 Energia Arcana disponibili in ogni tipo Standard / Avanzato / Professionale / Master.</div>` : ''}
        <div id="rec-reagents-box" style="display: ${((isSpecialJob && !['weapon_gem','repair','coating'].includes(modeType)) || modeType !== 'std') ? 'block' : 'none'}; margin-top:6px;">
          <label style="font-weight:bold; color:#38bdf8; font-size:11px;">Reagenti (1-5):</label>
          <div style="display:flex; justify-content:space-between; gap:4px; margin-bottom:6px; margin-top:2px;">
            ${[0,1,2,3,4].map(rIdx => {
              const rObj = recipeData.reagents[rIdx];
              return `<div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                <div id="recipe-slot-reg-${rIdx}" class="recipe-reagent-drop-slot ${rObj ? 'filled' : ''}">
                  ${rObj ? `<img src="${rObj.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">` : `<i class="fa-solid fa-flask" style="color:#38bdf8; font-size:18px;"></i>`}
                </div>
                <input type="number" id="recipe-reg-qty-${rIdx}" min="1" value="${rObj ? (rObj.qty || 1) : 1}" class="fvtt-input" style="width:48px; text-align:center; padding:2px; font-size:10px;">
              </div>`;
            }).join('')}
          </div>
        </div>

        <div id="rec-catalysts-box" style="display: ${((isSpecialJob && !['weapon_gem','repair','coating'].includes(modeType)) || modeType === 'pro' || modeType === 'mst' || modeType === 'dark_art') ? 'block' : 'none'}; margin-top:6px;">
          <label style="font-weight:bold; color:#c084fc; font-size:11px;">Catalizzatori (Max ${isSpecialJob ? 3 : 2}):</label>
          <div style="display:flex; justify-content:center; gap:16px; margin-bottom:6px; margin-top:2px;">
            ${(isSpecialJob ? [0,1,2] : [0,1]).map(cIdx => {
              const cObj = recipeData.catalysts[cIdx];
              return `<div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                <div id="recipe-slot-cat-${cIdx}" class="recipe-reagent-drop-slot ${cObj ? 'filled' : ''}" style="border-color:#a855f7;">
                  ${cObj ? `<img src="${cObj.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">` : `<i class="fa-solid fa-atom" style="color:#c084fc; font-size:20px;"></i>`}
                </div>
                <input type="number" id="recipe-cat-qty-${cIdx}" min="1" value="${cObj ? (cObj.qty || 1) : 1}" class="fvtt-input" style="width:48px; text-align:center; padding:2px; font-size:10px;">
              </div>`;
            }).join('')}
          </div>
        </div>

        <div id="rec-arcanes-box" style="display: ${((isSpecialJob && !['weapon_gem','repair','coating'].includes(modeType)) || modeType === 'mst' || modeType === 'weapon_gem') ? 'block' : 'none'}; margin-top:6px;">
          <label id="recipe-arcanes-label" style="font-weight:bold; color:#67e8f9; font-size:11px;">Energia Arcana (Max ${(isSpecialJob && modeType !== 'weapon_gem') ? 1 : 2}):</label>
          <div style="display:flex; justify-content:center; gap:16px; margin-bottom:6px; margin-top:2px;">
            ${[0,1].map(aIdx => {
              const aObj = recipeData.arcanes[aIdx];
              return `<div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                <div id="recipe-slot-arc-${aIdx}" class="recipe-reagent-drop-slot ${aObj ? 'filled' : ''}" style="border-color:#06b6d4;">
                  ${aObj ? `<img src="${aObj.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">` : `<i class="fa-solid fa-bolt-lightning" style="color:#67e8f9; font-size:20px;"></i>`}
                </div>
                <input type="number" id="recipe-arc-qty-${aIdx}" min="1" value="${aObj ? (aObj.qty || 1) : 1}" class="fvtt-input" style="width:48px; text-align:center; padding:2px; font-size:10px;">
              </div>`;
            }).join('')}
          </div>
        </div>

        <div id="rec-dark-box" style="display: ${modeType === 'dark_art' ? 'block' : 'none'}; margin-top:6px;">
          <label style="font-weight:bold; color:#fb7185; font-size:11px;">Materiali Oscuri (1-5):</label>
          <div style="display:flex; justify-content:space-between; gap:4px; margin-bottom:6px; margin-top:2px;">
            ${[0,1,2,3,4].map(dIdx => {
              const dObj = recipeData.darkReagents[dIdx];
              return `<div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                <div id="recipe-slot-dark-${dIdx}" class="recipe-reagent-drop-slot ${dObj ? 'filled' : ''}" style="border-color:#f43f5e;">
                  ${dObj ? `<img src="${dObj.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">` : `<i class="fa-solid fa-skull" style="color:#fb7185; font-size:18px;"></i>`}
                </div>
                <input type="number" id="recipe-dark-qty-${dIdx}" min="1" value="${dObj ? (dObj.qty || 1) : 1}" class="fvtt-input" style="width:48px; text-align:center; padding:2px; font-size:10px;">
              </div>`;
            }).join('')}
          </div>
        </div>

        <div id="rec-result-container" style="display: ${modeType === 'repair' || modeType === 'coating' || modeType === 'weapon_gem' ? 'none' : 'block'};">
          <label style="font-weight:bold; color:#10b981; margin-top:6px; display:block; font-size:11px;">Oggetto Prodotto (Risultato):</label>
          <div id="recipe-slot-result" class="recipe-drop-slot ${recipeData.result ? 'filled' : ''}" style="border-color:#10b981;">
            ${recipeData.result 
              ? `<img src="${recipeData.result.img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#10b981; font-weight:bold; font-size:12px;">${recipeData.result.name}</span>` 
              : `<span style="color:#10b981; font-size:11px; font-weight:bold;"><i class="fa-solid fa-hand-pointer"></i> Clicca o Trascina Risultato dal Compendio...</span>`}
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
          <button type="button" id="fvtt-recipe-save-btn" class="fvtt-btn" style="padding:8px 20px;">Salva Ricetta</button>
        </div>
      </div>
    `;

    renderUniversalDialog({
      title: recipeToEdit ? `🛠️ Modifica Ricetta` : "🛠️ Crea Nuova Ricetta",
      content: recipeDialogHtml,
      renderCB: (subRoot, dialogInst) => {
        const btnStd = subRoot.querySelector('#rec-mode-std');
        const btnAdv = subRoot.querySelector('#rec-mode-adv');
        const btnPro = subRoot.querySelector('#rec-mode-pro');
        const btnMst = subRoot.querySelector('#rec-mode-mst');
        const btnDark = subRoot.querySelector('#rec-mode-dark');
        const btnWeaponGem = subRoot.querySelector('#rec-mode-weapon-gem');
        const btnRepair = subRoot.querySelector('#rec-mode-repair');
        const btnCoating = subRoot.querySelector('#rec-mode-coating');

        const boxRules = subRoot.querySelector('#rec-rules-container');
        const boxRepair = subRoot.querySelector('#rec-repair-box');
        const boxCoatingLustro = subRoot.querySelector('#rec-coating-lustro-box');
        const boxMat1 = subRoot.querySelector('#rec-mat1-container');
        const boxMat2 = subRoot.querySelector('#rec-mat2-container');
        const boxTool2 = subRoot.querySelector('#rec-tool2-container');
        const boxResult = subRoot.querySelector('#rec-result-container');
        const lblMat2 = subRoot.querySelector('#lbl-mat2');
        const boxCoatingMsg = subRoot.querySelector('#rec-coating-msg');
        const boxWeaponGem = subRoot.querySelector('#rec-weapon-gem-box');
        const boxWeaponGemSlotRow = subRoot.querySelector('#recipe-weapon-gem-slot-row');
        const boxWeaponGemSlotCell = subRoot.querySelector('#recipe-weapon-gem-slot-cell');
        const boxWeaponRarityCell = subRoot.querySelector('#recipe-weapon-rarity-cell');
        const boxWeaponGemAutoNote = subRoot.querySelector('#recipe-weapon-gem-auto-note');
        const weaponGemActionSelect = subRoot.querySelector('#recipe-weapon-gem-action');

        const boxSlot3 = subRoot.querySelector('#rec-slot-3-box');
        const boxReagents = subRoot.querySelector('#rec-reagents-box');
        const boxCatalysts = subRoot.querySelector('#rec-catalysts-box');
        const boxArcanes = subRoot.querySelector('#rec-arcanes-box');
        const boxDark = subRoot.querySelector('#rec-dark-box');
        const specialResourcesNote = subRoot.querySelector('#rec-special-resources-note');

        const allModeBtns = [btnStd, btnAdv, btnPro, btnMst, btnDark, btnWeaponGem, btnRepair, btnCoating];

        function updateModeUI(mode) {
          modeType = mode;
          allModeBtns.forEach(b => b?.classList.remove('active'));
          if (specialResourcesNote) specialResourcesNote.style.display = (isSpecialJob && isSpecialFullCraftingMode(mode)) ? 'block' : 'none';

          if (mode === 'std') btnStd?.classList.add('active');
          else if (mode === 'adv') btnAdv?.classList.add('active');
          else if (mode === 'pro') btnPro?.classList.add('active');
          else if (mode === 'mst') btnMst?.classList.add('active');
          else if (mode === 'dark_art') btnDark?.classList.add('active');
          else if (mode === 'weapon_gem') btnWeaponGem?.classList.add('active');
          else if (mode === 'repair') btnRepair?.classList.add('active');
          else if (mode === 'coating') btnCoating?.classList.add('active');

          if (mode === 'weapon_gem') {
            if (boxRules) boxRules.style.display = 'block';
            if (boxWeaponGem) boxWeaponGem.style.display = 'block';
            if (boxRepair) boxRepair.style.display = 'none';
            if (boxCoatingLustro) boxCoatingLustro.style.display = 'none';
            if (boxMat1) boxMat1.style.display = 'block';
            if (boxMat2) boxMat2.style.display = 'block';
            if (boxTool2) boxTool2.style.display = 'block';
            if (boxResult) boxResult.style.display = 'none';
            if (lblMat2) lblMat2.innerText = 'Oggetto / Gemma Specifica:';
            if (boxCoatingMsg) boxCoatingMsg.style.display = 'none';

            // Disabilita lo slot ing1 se è di tipo weapon_gem
            const slotIng1 = subRoot.querySelector('#recipe-slot-ing1');
            if (slotIng1) {
              slotIng1.classList.add('disabled');
              slotIng1.style.cursor = 'default';
              slotIng1.style.pointerEvents = 'none';
              // Nelle ricette Foratura/Gemme lo Slot 1 rappresenta sempre l'arma bersaglio:
              // non esiste un oggetto specifico durante la creazione della ricetta. Evita quindi
              // di leggere recipeData.ing1 quando è null (nuova ricetta) e mostra un placeholder fisso.
              const ing1Img = recipeData.ing1?.img;
              const ing1Name = recipeData.ing1?.name || 'Qualsiasi Arma Realistica';
              slotIng1.innerHTML = ing1Img
                ? `<img src="${ing1Img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#f3f4f6; font-weight:bold; font-size:12px;">${ing1Name}</span>`
                : `<span style="color:#f59e0b; font-size:11px; font-weight:bold;"><i class="fa-solid fa-screwdriver-wrench"></i> ${ing1Name} (Automatico)</span>`;
            }

            // Assicuriamoci che i reagenti e l'energia arcana siano visibili e interattivi
            if (boxReagents) {
              boxReagents.style.display = 'block';
              boxReagents.style.pointerEvents = 'auto';
              boxReagents.style.opacity = '1';
            }
            if (boxArcanes) {
              boxArcanes.style.display = 'block';
              boxArcanes.style.pointerEvents = 'auto';
              boxArcanes.style.opacity = '1';
            }

            if (boxSlot3) boxSlot3.style.display = 'none';
            if (boxCatalysts) boxCatalysts.style.display = 'none';
            if (boxDark) boxDark.style.display = 'none';
          } else {
            // Ripristina il comportamento per gli altri tipi
            const slotIng1 = subRoot.querySelector('#recipe-slot-ing1');
            if (slotIng1) {
              slotIng1.classList.remove('disabled');
              slotIng1.style.cursor = 'pointer';
              slotIng1.style.pointerEvents = 'auto';
            }
            if (boxResult) boxResult.style.display = 'block';
            // ... resto delle impostazioni ...
          }

          // Gestione per repair, coating, ecc.
          if (mode === 'repair') {
            if (boxRules) boxRules.style.display = 'none';
            if (boxRepair) boxRepair.style.display = 'block';
            if (boxCoatingLustro) boxCoatingLustro.style.display = 'none';
            if (boxMat1) boxMat1.style.display = 'block';
            if (boxMat2) boxMat2.style.display = 'block';
            if (boxTool2) boxTool2.style.display = 'block';
            if (boxResult) boxResult.style.display = 'none';
            if (lblMat2) lblMat2.innerText = 'Kit di Riparazione:';
            if (boxCoatingMsg) boxCoatingMsg.style.display = 'none';

            if (boxSlot3) boxSlot3.style.display = 'none';
            if (boxReagents) boxReagents.style.display = 'block';
            if (boxCatalysts) boxCatalysts.style.display = 'none';
            if (boxArcanes) boxArcanes.style.display = 'none';
            if (boxDark) boxDark.style.display = 'none';
          } else if (mode === 'coating') {
            if (boxRules) boxRules.style.display = 'none';
            if (boxRepair) boxRepair.style.display = 'none';
            if (boxCoatingLustro) boxCoatingLustro.style.display = 'block';
            if (boxMat1) boxMat1.style.display = 'none';
            if (boxMat2) boxMat2.style.display = 'block';
            if (boxTool2) boxTool2.style.display = 'block';
            if (boxResult) boxResult.style.display = 'none';
            if (lblMat2) lblMat2.innerText = 'Materiale Rivestimento Specifico (Obbligatorio):';
            if (boxCoatingMsg) boxCoatingMsg.style.display = 'block';

            if (boxSlot3) boxSlot3.style.display = 'none';
            if (boxReagents) boxReagents.style.display = 'block';
            if (boxCatalysts) boxCatalysts.style.display = 'none';
            if (boxArcanes) boxArcanes.style.display = 'none';
            if (boxDark) boxDark.style.display = 'none';
          } else if (mode !== 'weapon_gem') {
            // Per std, adv, pro, mst, dark_art
            if (boxRules) boxRules.style.display = 'block';
            if (boxRepair) boxRepair.style.display = 'none';
            if (boxCoatingLustro) boxCoatingLustro.style.display = 'none';
            if (boxMat1) boxMat1.style.display = 'block';
            if (boxMat2) boxMat2.style.display = 'block';
            if (boxTool2) boxTool2.style.display = 'block';
            if (boxResult) boxResult.style.display = 'block';
            if (lblMat2) lblMat2.innerText = '2° Materiale:';
            if (boxCoatingMsg) boxCoatingMsg.style.display = 'none';

            if (mode === 'std') {
              if (boxSlot3) boxSlot3.style.display = 'none';
              if (boxReagents) boxReagents.style.display = 'none';
              if (boxCatalysts) boxCatalysts.style.display = 'none';
              if (boxArcanes) boxArcanes.style.display = 'none';
              if (boxDark) boxDark.style.display = 'none';
            } else if (mode === 'adv') {
              if (boxSlot3) boxSlot3.style.display = 'none';
              if (boxReagents) boxReagents.style.display = 'block';
              if (boxCatalysts) boxCatalysts.style.display = 'none';
              if (boxArcanes) boxArcanes.style.display = 'none';
              if (boxDark) boxDark.style.display = 'none';
            } else if (mode === 'pro') {
              if (boxSlot3) boxSlot3.style.display = 'block';
              if (boxReagents) boxReagents.style.display = 'block';
              if (boxCatalysts) boxCatalysts.style.display = 'block';
              if (boxArcanes) boxArcanes.style.display = 'none';
              if (boxDark) boxDark.style.display = 'none';
            } else if (mode === 'mst') {
              if (boxSlot3) boxSlot3.style.display = 'block';
              if (boxReagents) boxReagents.style.display = 'block';
              if (boxCatalysts) boxCatalysts.style.display = 'block';
              if (boxArcanes) boxArcanes.style.display = 'block';
              if (boxDark) boxDark.style.display = 'none';
            } else if (mode === 'dark_art') {
              if (boxSlot3) boxSlot3.style.display = 'block';
              if (boxReagents) boxReagents.style.display = 'block';
              if (boxCatalysts) boxCatalysts.style.display = 'block';
              if (boxArcanes) boxArcanes.style.display = 'none';
              if (boxDark) boxDark.style.display = 'block';
            }
          }

          // Nei Job Speciali i tipi standard usano sempre il banco completo speciale.
          const specialRecipeMode = isSpecialJob && isSpecialFullCraftingMode(mode);
          if (specialRecipeMode) {
            // Job Speciale: la struttura ricetta è sempre completa, a prescindere dalla stella.
            if (boxSlot3) boxSlot3.style.display = 'block';
            if (boxReagents) boxReagents.style.display = 'block';
            if (boxCatalysts) boxCatalysts.style.display = 'block';
            if (boxArcanes) boxArcanes.style.display = 'block';
            if (boxDark) boxDark.style.display = mode === 'dark_art' ? 'block' : 'none';
            if (boxResult) boxResult.style.display = 'block';
            const arc2Wrap = subRoot.querySelector('#recipe-slot-arc-1')?.parentElement;
            if (arc2Wrap) arc2Wrap.style.display = 'none';
            const arcLabel = subRoot.querySelector('#recipe-arcanes-label');
            if (arcLabel) arcLabel.textContent = 'Energia Arcana (Max 1):';
            const forcedStars = getSpecialCraftingStarRequirement(mode);
            const reqInput = subRoot.querySelector('#recipe-req-level');
            if (reqInput && forcedStars) {
              reqInput.value = String(forcedStars);
              reqInput.readOnly = true;
              reqInput.title = `Requisito fisso per ${mode === 'std' ? 'Standard' : mode === 'adv' ? 'Avanzato' : mode === 'pro' ? 'Professionale' : 'Master'}: ${forcedStars} stelle`;
              recipeData.requiredLevel = forcedStars;
            } else if (reqInput) {
              reqInput.readOnly = false;
              reqInput.title = '';
            }
          }

          if (mode === 'weapon_gem') {
            const arc2Wrap = subRoot.querySelector('#recipe-slot-arc-1')?.parentElement;
            if (arc2Wrap) arc2Wrap.style.display = 'flex';
            const arcLabel = subRoot.querySelector('#recipe-arcanes-label');
            if (arcLabel) arcLabel.textContent = 'Energia Arcana (Max 2):';
            updateWeaponGemActionUI();
          }
        }

        [
          { btn: btnStd, mode: 'std' },
          { btn: btnAdv, mode: 'adv' },
          { btn: btnPro, mode: 'pro' },
          { btn: btnMst, mode: 'mst' },
          { btn: btnDark, mode: 'dark_art' },
          { btn: btnWeaponGem, mode: 'weapon_gem' },
          { btn: btnRepair, mode: 'repair' },
          { btn: btnCoating, mode: 'coating' }
        ].forEach(item => {
          if (item.btn) {
            item.btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              updateModeUI(item.mode);
            });
          }
        });

        // Imposta la modalità iniziale
        updateModeUI(modeType);

        if (weaponGemActionSelect) {
          weaponGemActionSelect.addEventListener('change', () => {
            updateWeaponGemActionUI();
          });
        }

        function updateWeaponGemActionUI() {
          if (!weaponGemActionSelect) return;
          const action = (weaponGemActionSelect.value || 'drill').toLowerCase();
          const isDrill = action === 'drill';

          // La Foratura sceglie automaticamente lo slot libero, ma DEVE comunque
          // permettere al DM di scegliere la rarità dell'arma nella ricetta.
          // Per questo nascondiamo solo il campo "Slot bersaglio" e lasciamo
          // sempre visibile il selettore Common -> Artifact.
          if (boxWeaponGemSlotRow) {
            boxWeaponGemSlotRow.style.display = 'grid';
            boxWeaponGemSlotRow.style.gridTemplateColumns = isDrill ? '1fr' : '1fr 1fr';
          }
          if (boxWeaponGemSlotCell) boxWeaponGemSlotCell.style.display = isDrill ? 'none' : 'block';
          if (boxWeaponRarityCell) boxWeaponRarityCell.style.display = 'block';
          if (boxWeaponGemAutoNote) {
            boxWeaponGemAutoNote.style.display = isDrill ? 'block' : 'none';
            boxWeaponGemAutoNote.innerHTML = isDrill
              ? '<i class="fa-solid fa-wand-magic-sparkles"></i> Foratura: il sistema cercherà automaticamente il primo slot non forato e non perso.'
              : (action === 'insert'
                ? '<i class="fa-solid fa-gem"></i> Incastonatura: scegli lo slot forato su cui inserire la gemma.'
                : '<i class="fa-solid fa-hand-sparkles"></i> Rimozione: scegli lo slot che contiene la gemma da estrarre.');
          }
        }

        updateWeaponGemActionUI();

        function setupSlot(slotId, title, getVal, setVal, renderCB) {
          const slotEl = subRoot.querySelector(slotId);
          if (!slotEl) return;

          // Se lo slot è disabilitato, non attaccare eventi
          if (slotEl.classList.contains('disabled')) return;

          slotEl.addEventListener('click', (e) => {
            if (e.target.closest('.recipe-drop-slot')?.classList.contains('filled') && e.ctrlKey) {
              setVal(null);
              renderCB(null, slotEl);
              return;
            }
            showAllItemsPicker(title, (itemObj) => {
              setVal(itemObj);
              renderCB(itemObj, slotEl);
            });
          });

          slotEl.addEventListener('dragover', (e) => { e.preventDefault(); slotEl.classList.add('drag-over'); });
          slotEl.addEventListener('dragleave', () => slotEl.classList.remove('drag-over'));
          slotEl.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            slotEl.classList.remove('drag-over');
            try {
              const rawData = e.dataTransfer.getData("text/plain");
              if (!rawData) return;
              const data = JSON.parse(rawData);
              let itemObj = null;
              if (data.uuid) {
                const doc = await fromUuid(data.uuid);
                if (doc) itemObj = { name: doc.name, uuid: doc.uuid, img: doc.img };
              } else if (data.name) {
                itemObj = { name: data.name, uuid: null, img: data.img || "icons/svg/item-bag.svg" };
              }
              if (itemObj) {
                setVal(itemObj);
                renderCB(itemObj, slotEl);
              }
            } catch(err) { console.error(err); }
          });
        }

        setupSlot('#recipe-slot-ing1', '1° Materiale Principale', () => recipeData.ing1, (v) => recipeData.ing1 = v, (obj, el) => {
          if (obj) {
            el.classList.add('filled');
            el.innerHTML = `<img src="${obj.img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#f3f4f6; font-weight:bold; font-size:12px;">${obj.name}</span>`;
          } else {
            el.classList.remove('filled');
            el.innerHTML = `<span style="color:#f59e0b; font-size:11px; font-weight:bold;"><i class="fa-solid fa-hand-pointer"></i> ${modeType === 'repair' ? 'Qualsiasi Arma (Automatico)' : (modeType === 'weapon_gem' ? 'Qualsiasi Arma Realistica (Automatico)' : 'Clicca o Trascina 1° Materiale...')}</span>`;
          }
        });

        setupSlot('#recipe-slot-ing2', '2° Materiale / Rivestimento / Kit', () => recipeData.ing2, (v) => recipeData.ing2 = v, (obj, el) => {
          if (obj) {
            el.classList.add('filled');
            el.innerHTML = `<img src="${obj.img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#f3f4f6; font-weight:bold; font-size:12px;">${obj.name}</span>`;
          } else {
            el.classList.remove('filled');
            el.innerHTML = `<span style="color:#f59e0b; font-size:11px; font-weight:bold;"><i class="fa-solid fa-hand-pointer"></i> ${modeType === 'coating' ? 'Clicca o Trascina Materiale Rivestimento Obbligatorio...' : (modeType === 'weapon_gem' ? 'Clicca o Trascina Oggetto / Gemma Specifica...' : 'Clicca o Trascina Materiale...')}</span>`;
          }
        });

        setupSlot('#recipe-slot-ing3', '3° Materiale Principale', () => recipeData.ing3, (v) => recipeData.ing3 = v, (obj, el) => {
          if (obj) {
            el.classList.add('filled');
            el.innerHTML = `<img src="${obj.img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#f3f4f6; font-weight:bold; font-size:12px;">${obj.name}</span>`;
          } else {
            el.classList.remove('filled');
            el.innerHTML = `<span style="color:#c084fc; font-size:11px; font-weight:bold;"><i class="fa-solid fa-hand-pointer"></i> Clicca o Trascina 3° Materiale...</span>`;
          }
        });

        [ [0, isSpecialJob ? 2 : 3], [1,2], [2, isSpecialJob ? 2 : 1] ].forEach(([sIdx, maxTools]) => {
          for (let tIdx = 0; tIdx < maxTools; tIdx++) {
            setupSlot(`#rec-tool-${sIdx}-${tIdx}`, `Strumento Richiesto (Slot ${sIdx+1} - ${tIdx+1})`, () => recipeData.tools[sIdx][tIdx], (v) => recipeData.tools[sIdx][tIdx] = v, (obj, el) => {
              if (obj) {
                el.classList.add('filled');
                el.innerHTML = `<img src="${obj.img}" style="width:26px; height:26px; border-radius:4px;">`;
              } else {
                el.classList.remove('filled');
                el.innerHTML = `<i class="fa-solid fa-wrench"></i>`;
              }
            });
          }
        });

        [0, 1, 2, 3, 4].forEach(rIdx => {
          setupSlot(`#recipe-slot-reg-${rIdx}`, `Reagente ${rIdx + 1}`, () => recipeData.reagents[rIdx], (v) => recipeData.reagents[rIdx] = v, (obj, el) => {
            if (obj) {
              el.classList.add('filled');
              el.innerHTML = `<img src="${obj.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">`;
            } else {
              el.classList.remove('filled');
              el.innerHTML = `<i class="fa-solid fa-flask" style="color:#38bdf8; font-size:18px;"></i>`;
            }
          });
        });

        (isSpecialJob ? [0,1,2] : [0,1]).forEach(cIdx => {
          setupSlot(`#recipe-slot-cat-${cIdx}`, `Catalizzatore ${cIdx + 1}`, () => recipeData.catalysts[cIdx], (v) => recipeData.catalysts[cIdx] = v, (obj, el) => {
            if (obj) {
              el.classList.add('filled');
              el.innerHTML = `<img src="${obj.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">`;
            } else {
              el.classList.remove('filled');
              el.innerHTML = `<i class="fa-solid fa-atom" style="color:#c084fc; font-size:20px;"></i>`;
            }
          });
        });

        [0, 1].forEach(aIdx => {
          setupSlot(`#recipe-slot-arc-${aIdx}`, `Energia Arcana ${aIdx + 1}`, () => recipeData.arcanes[aIdx], (v) => recipeData.arcanes[aIdx] = v, (obj, el) => {
            if (obj) {
              el.classList.add('filled');
              el.innerHTML = `<img src="${obj.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">`;
            } else {
              el.classList.remove('filled');
              el.innerHTML = `<i class="fa-solid fa-bolt-lightning" style="color:#67e8f9; font-size:20px;"></i>`;
            }
          });
        });

        [0, 1, 2, 3, 4].forEach(dIdx => {
          setupSlot(`#recipe-slot-dark-${dIdx}`, `Materiale Oscuro ${dIdx + 1}`, () => recipeData.darkReagents[dIdx], (v) => recipeData.darkReagents[dIdx] = v, (obj, el) => {
            if (obj) {
              el.classList.add('filled');
              el.innerHTML = `<img src="${obj.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">`;
            } else {
              el.classList.remove('filled');
              el.innerHTML = `<i class="fa-solid fa-skull" style="color:#fb7185; font-size:18px;"></i>`;
            }
          });
        });

        setupSlot('#recipe-slot-result', 'Oggetto Prodotto (Risultato)', () => recipeData.result, (v) => recipeData.result = v, (obj, el) => {
          if (obj) {
            el.classList.add('filled');
            el.innerHTML = `<img src="${obj.img}" style="width:28px; height:28px; border-radius:4px;"><span style="color:#10b981; font-weight:bold; font-size:12px;">${obj.name}</span>`;
          } else {
            el.classList.remove('filled');
            el.innerHTML = `<span style="color:#10b981; font-size:11px; font-weight:bold;"><i class="fa-solid fa-hand-pointer"></i> Clicca o Trascina Risultato dal Compendio...</span>`;
          }
        });

        const saveBtn = subRoot.querySelector('#fvtt-recipe-save-btn');
        if (saveBtn) {
          saveBtn.addEventListener('click', async (e) => {
            e?.preventDefault();
            e?.stopPropagation();

            const customNameVal = (subRoot.querySelector('#recipe-custom-name')?.value || "").trim();
            const secretVal = !!subRoot.querySelector('#recipe-secret')?.checked;
            const forcedSpecialStars = isSpecialJob ? getSpecialCraftingStarRequirement(modeType) : null;
            const reqLvVal = forcedSpecialStars || Math.clamp(parseInt(subRoot.querySelector('#recipe-req-level')?.value || 1), 1, isSpecialJob ? 5 : 10);
            const expRewVal = isSpecialJob ? 0 : Math.max(1, parseInt(subRoot.querySelector('#recipe-exp-reward')?.value || 25));
            const presRewVal = Math.max(0, parseInt(subRoot.querySelector('#recipe-prestige-reward')?.value || 0));

            const baseSuccessVal = Math.clamp(parseInt(subRoot.querySelector('#recipe-base-success')?.value || 100), 1, 100);
            const maxSuccessVal = Math.clamp(parseInt(subRoot.querySelector('#recipe-max-success')?.value || 100), 1, 100);
            const bonusExtraMainVal = Math.max(0, parseInt(subRoot.querySelector('#recipe-bonus-extra-main')?.value || 0));
            const bonusExtraReagentVal = Math.max(0, parseInt(subRoot.querySelector('#recipe-bonus-extra-reagent')?.value || 0));
            const bonusExtraCatalystVal = Math.max(0, parseInt(subRoot.querySelector('#recipe-bonus-extra-catalyst')?.value || 0));
            const bonusExtraArcaneVal = Math.max(0, parseInt(subRoot.querySelector('#recipe-bonus-extra-arcane')?.value || 0));
            const bonusExtraDarkVal = Math.max(0, parseInt(subRoot.querySelector('#recipe-bonus-extra-dark')?.value || 0));
            const bonusToolVal = Math.max(0, parseInt(subRoot.querySelector('#recipe-bonus-tool')?.value || 0));

            const qty1Val = Math.max(1, parseInt(subRoot.querySelector('#recipe-qty-1')?.value || 1));
            const qty2Val = Math.max(1, parseInt(subRoot.querySelector('#recipe-qty-2')?.value || 1));
            const qty3Val = Math.max(1, parseInt(subRoot.querySelector('#recipe-qty-3')?.value || 1));
            const weaponGemActionVal = (subRoot.querySelector('#recipe-weapon-gem-action')?.value || recipeData.weaponGemAction || 'drill').toLowerCase();
            const weaponGemSlotVal = Math.clamp(parseInt(subRoot.querySelector('#recipe-weapon-gem-slot')?.value || recipeData.targetGemSlot || 1), 1, 3);
            const weaponRarityVal = normalizeWeaponRarity(subRoot.querySelector('#recipe-weapon-rarity')?.value || recipeData.weaponRarity || 'common');

            if (modeType === 'weapon_gem') {
              if (!recipeData.ing2) {
                ui.notifications.error("Inserisci l\'oggetto / gemma specifico nel 2° slot!");
                return;
              }

              const activeReagents = recipeData.reagents.map((r, i) => r ? { name: r.name, qty: Math.max(1, parseInt(subRoot.querySelector(`#recipe-reg-qty-${i}`)?.value || 1)) } : null).filter(Boolean);
              const activeArcanes = recipeData.arcanes.map((a, i) => a ? { name: a.name, qty: Math.max(1, parseInt(subRoot.querySelector(`#recipe-arc-qty-${i}`)?.value || 1)) } : null).filter(Boolean);

              // Genera risultato automaticamente. Foratura/Rimozione useranno nel banco
              // l'immagine dell'arma nello Slot 1; Incastonatura usa l'immagine della gemma/oggetto.
              const resultName = `${getWeaponGemActionLabel(weaponGemActionVal)} Slot ${weaponGemSlotVal}`;
              const ingredientImg = recipeData.ing2?.img || "icons/svg/item-bag.svg";
              const previewImg = weaponGemActionVal === 'insert' ? ingredientImg : getWeaponGemPreviewImage(weaponGemActionVal);

              const newRecipeObj = {
                id: recipeToEdit ? recipeToEdit.id : ('r_' + Date.now()),
                secret: secretVal,
                type: 'weapon_gem',
                customName: customNameVal,
                requiredLevel: reqLvVal,
                expReward: expRewVal,
                prestigeReward: presRewVal,
                baseSuccessRate: baseSuccessVal,
                maxSuccessRate: maxSuccessVal,
                bonusPerExtraMain: bonusExtraMainVal,
                bonusPerExtraReagent: bonusExtraReagentVal,
                bonusPerExtraCatalyst: 0,
                bonusPerExtraArcane: bonusExtraArcaneVal,
                bonusPerExtraDark: 0,
                bonusPerTool: bonusToolVal,
                weaponGemAction: weaponGemActionVal,
                targetGemSlot: weaponGemSlotVal,
                weaponRarity: weaponRarityVal,
                ing1: "Arma Realistica",
                qty1: 1,
                ing2: recipeData.ing2.name,
                ing2Img: ingredientImg,
                qty2: qty2Val,
                tools: [ [recipeData.tools[0]?.[0] || null], [recipeData.tools[1]?.[0] || null], [null] ],
                reagents: activeReagents,
                catalysts: [],
                arcanes: activeArcanes,
                darkReagents: [],
                result: resultName,
                resultUuid: null,
                resultImg: previewImg,
                icon: 'fa-gem'
              };

              if (editIndex >= 0) recipes[editIndex] = newRecipeObj;
              else recipes.push(newRecipeObj);

              await actor.setFlag('world', flagName, recipes);
              renderRecipeList();
              ui.notifications.info("Ricetta Gemme / Forature salvata con successo!");
              if (dialogInst && typeof dialogInst.close === 'function') dialogInst.close();
              return;
            }

            if (modeType === 'repair') {
              if (!recipeData.ing2) {
                ui.notifications.error("Inserisci un Kit o un Materiale di Riparazione nel 2° slot!");
                return;
              }

              const activeReagents = recipeData.reagents.map((r, i) => r ? { name: r.name, qty: Math.max(1, parseInt(subRoot.querySelector(`#recipe-reg-qty-${i}`)?.value || 1)) } : null).filter(Boolean);

              const newRecipeObj = {
                id: recipeToEdit ? recipeToEdit.id : ('r_' + Date.now()),
                secret: secretVal,
                type: 'repair',
                customName: customNameVal,
                requiredLevel: reqLvVal,
                expReward: expRewVal,
                repairAmount: parseInt(subRoot.querySelector('#recipe-repair-amount').value) || 50,
                ing1: "Qualsiasi Arma",
                qty1: 1,
                ing2: recipeData.ing2.name,
                qty2: qty2Val,
                tools: recipeData.tools,
                reagents: activeReagents,
                result: "Riparazione Arma",
                resultImg: recipeData.ing2.img || "icons/svg/repair.svg",
                icon: "fa-wrench"
              };

              if (editIndex >= 0) recipes[editIndex] = newRecipeObj;
              else recipes.push(newRecipeObj);

              await actor.setFlag("world", flagName, recipes);
              renderRecipeList();
              ui.notifications.info("Ricetta di riparazione salvata con successo!");
              if (dialogInst && typeof dialogInst.close === "function") dialogInst.close();
              return;
            }
            
            if (modeType === 'coating') {
              if (!recipeData.ing2) {
                ui.notifications.error("Inserisci un Materiale Rivestimento Specifico nel 2° slot!");
                return;
              }

              const coatingLustroVal = Math.clamp(parseInt(subRoot.querySelector('#recipe-coating-lustro')?.value || 100), 1, 100);
              const activeReagents = recipeData.reagents.map((r, i) => r ? { name: r.name, qty: Math.max(1, parseInt(subRoot.querySelector(`#recipe-reg-qty-${i}`)?.value || 1)) } : null).filter(Boolean);

              const newRecipeObj = {
                id: recipeToEdit ? recipeToEdit.id : ('r_' + Date.now()),
                secret: secretVal,
                type: 'coating',
                customName: customNameVal,
                requiredLevel: reqLvVal,
                expReward: expRewVal,
                prestigeReward: presRewVal,
                coatingLustro: coatingLustroVal,
                ing1: "Qualsiasi Arma",
                qty1: 1,
                ing2: recipeData.ing2.name,
                qty2: qty2Val,
                tools: recipeData.tools,
                reagents: activeReagents,
                result: `Applicazione: ${recipeData.ing2.name}`,
                resultImg: recipeData.ing2.img || "icons/svg/upgrade.svg",
                icon: "fa-layer-group"
              };

              if (editIndex >= 0) recipes[editIndex] = newRecipeObj;
              else recipes.push(newRecipeObj);

              await actor.setFlag("world", flagName, recipes);
              renderRecipeList();
              ui.notifications.info("Ricetta Rivestimento salvata con successo!");
              if (dialogInst && typeof dialogInst.close === "function") dialogInst.close();
              return;
            }

            const isSpecialStandardType = isSpecialJob && isSpecialFullCraftingMode(modeType);
            if (recipeData.ing1 && recipeData.ing2 && recipeData.result && (!isSpecialStandardType || recipeData.ing3)) {
              const activeReagents = (isSpecialStandardType || modeType !== 'std') 
                ? recipeData.reagents.map((r, i) => r ? { name: r.name, qty: Math.max(1, parseInt(subRoot.querySelector(`#recipe-reg-qty-${i}`)?.value || 1)) } : null).filter(Boolean)
                : [];

              const activeCatalysts = (isSpecialStandardType || modeType === 'pro' || modeType === 'mst' || modeType === 'dark_art')
                ? recipeData.catalysts.map((c, i) => c ? { name: c.name, qty: Math.max(1, parseInt(subRoot.querySelector(`#recipe-cat-qty-${i}`)?.value || 1)) } : null).filter(Boolean)
                : [];

              const activeArcanes = (isSpecialStandardType || modeType === 'mst')
                ? (isSpecialStandardType ? recipeData.arcanes.slice(0,1) : recipeData.arcanes).map((a, i) => a ? { name: a.name, qty: Math.max(1, parseInt(subRoot.querySelector(`#recipe-arc-qty-${i}`)?.value || 1)) } : null).filter(Boolean)
                : [];

              const activeDarks = (modeType === 'dark_art')
                ? recipeData.darkReagents.map((d, i) => d ? { name: d.name, qty: Math.max(1, parseInt(subRoot.querySelector(`#recipe-dark-qty-${i}`)?.value || 1)) } : null).filter(Boolean)
                : [];

              const newRecipeObj = {
                id: recipeToEdit ? recipeToEdit.id : ('r_' + Date.now()),
                secret: secretVal,
                type: modeType,
                customName: customNameVal,
                requiredLevel: reqLvVal,
                expReward: expRewVal,
                prestigeReward: presRewVal,
                baseSuccessRate: baseSuccessVal,
                maxSuccessRate: maxSuccessVal,
                bonusPerExtraMain: bonusExtraMainVal,
                bonusPerExtraReagent: bonusExtraReagentVal,
                bonusPerExtraCatalyst: bonusExtraCatalystVal,
                bonusPerExtraArcane: bonusExtraArcaneVal,
                bonusPerExtraDark: bonusExtraDarkVal,
                bonusPerTool: bonusToolVal,
                ing1: recipeData.ing1.name,
                qty1: qty1Val,
                ing2: recipeData.ing2.name,
                qty2: qty2Val,
                ing3: (isSpecialStandardType || modeType === 'pro' || modeType === 'mst' || modeType === 'dark_art') && recipeData.ing3 ? recipeData.ing3.name : null,
                qty3: qty3Val,
                tools: recipeData.tools,
                reagents: activeReagents,
                catalysts: activeCatalysts,
                arcanes: activeArcanes,
                darkReagents: activeDarks,
                result: recipeData.result.name,
                resultUuid: recipeData.result.uuid || (recipeToEdit ? recipeToEdit.resultUuid : null),
                resultImg: recipeData.result.img || (recipeToEdit ? recipeToEdit.resultImg : "icons/svg/item-bag.svg"),
                weaponGemAction: recipeData.weaponGemAction,
                targetGemSlot: recipeData.targetGemSlot,
                icon: modeType === 'weapon_gem' ? 'fa-gem' : (modeType === 'dark_art' ? 'fa-skull' : (modeType === 'mst' ? 'fa-wand-magic-sparkles' : (modeType === 'pro' ? 'fa-crown' : (modeType === 'adv' ? 'fa-flask-vial' : 'fa-cube'))))
              };

              if (editIndex >= 0) recipes[editIndex] = newRecipeObj;
              else recipes.push(newRecipeObj);

              await actor.setFlag("world", flagName, recipes);
              renderRecipeList();
              ui.notifications.info(`Ricetta per "${customNameVal || recipeData.result.name}" salvata!`);
              if (dialogInst && typeof dialogInst.close === "function") dialogInst.close();
            } else {
              ui.notifications.error(isSpecialStandardType ? "Per una ricetta di Job Speciale servono Slot 1, Slot 2, Slot 3 e Risultato." : "Inserisci almeno i 2 materiali principali ed il risultato!");
            }
          });
        }
      },
      width: 520,
      height: 640
    });
  }

  const addRecipeBtn = root.querySelector('#fvtt-btn-add-recipe');
  if (addRecipeBtn) addRecipeBtn.addEventListener('click', (e) => { e?.preventDefault(); e?.stopPropagation(); openNewRecipeDialog(); });

  // --- FIX: Ricerca inventario ---
  const searchInput = root.querySelector('#fvtt-inv-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderInventory();
    });
  }

  renderInventory();
  renderToolSlots();
  setCraftingMode('std');
}